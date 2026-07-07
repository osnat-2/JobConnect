#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.resolve(process.argv[2] || path.join(repoRoot, 'compliance_report.md'));
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'bin', 'obj', 'dist', 'coverage', '__pycache__']);

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function walkDir(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkDir(fullPath, files);
      }
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectRelevantFiles(root) {
  const result = { bff: [], services: [], shared: [] };
  const searchPaths = [
    ['backend/src/gateway/BFF', 'bff'],
    ['src/gateway/BFF', 'bff'],
    ['backend/src/services', 'services'],
    ['src/services', 'services'],
    ['backend/shared', 'shared'],
    ['shared', 'shared']
  ];

  for (const [relativePath, bucket] of searchPaths) {
    const absPath = path.join(root, relativePath);
    if (fs.existsSync(absPath)) {
      const files = walkDir(absPath);
      if (bucket === 'bff') result.bff.push(...files);
      if (bucket === 'services') result.services.push(...files);
      if (bucket === 'shared') result.shared.push(...files);
    }
  }

  return result;
}

function toRelative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function createRequirement(id, title, category, status, evidence, notes) {
  return { id, title, category, status, evidence, notes };
}

function buildAudit(root) {
  const files = collectRelevantFiles(root);
  const bffFiles = files.bff.filter(file => /\.(js|ts|mjs|cjs)$/.test(file));
  const serviceFiles = files.services.filter(file => /\.(cs|csproj|json|yaml|yml)$/.test(file));
  const sharedFiles = files.shared;
  const allFiles = [...bffFiles, ...serviceFiles, ...sharedFiles];

  const requirements = [];

  const bffEntries = bffFiles.filter(file => ['app.js', 'server.js', 'index.js'].includes(path.basename(file)));
  requirements.push(createRequirement(
    'REQ-01',
    'Gateway/BFF entry points present',
    'Gateway',
    bffEntries.length ? '[Compliant]' : (bffFiles.length ? '[Partial]' : '[Missing]'),
    bffEntries.map(file => toRelative(root, file)).slice(0, 5),
    'The BFF should expose an entry point for API routing and request handling.'
  ));

  const serviceProjects = serviceFiles.filter(file => file.endsWith('.csproj'));
  const servicePrograms = serviceFiles.filter(file => path.basename(file) === 'Program.cs');
  requirements.push(createRequirement(
    'REQ-02',
    'Microservice projects and entry points exist',
    'Services',
    serviceProjects.length && servicePrograms.length ? '[Compliant]' : (serviceFiles.length ? '[Partial]' : '[Missing]'),
    [...serviceProjects, ...servicePrograms].map(file => toRelative(root, file)).slice(0, 10),
    'The repository should contain .NET service projects with startup code.'
  ));

  const sharedRequired = ['AuthorizationExtensions.cs', 'ServiceBootstrapExtensions.cs', 'UserContext.cs', 'Shared.Infrastructure.csproj'];
  const sharedHits = sharedFiles.filter(file => sharedRequired.includes(path.basename(file)));
  requirements.push(createRequirement(
    'REQ-03',
    'Shared infrastructure exists',
    'Shared Infrastructure',
    sharedHits.length >= 3 ? '[Compliant]' : (sharedHits.length ? '[Partial]' : '[Missing]'),
    sharedHits.map(file => toRelative(root, file)).slice(0, 10),
    'Shared infrastructure should hold common auth, bootstrap, and user context utilities.'
  ));

  const rabbitSignals = allFiles.filter(file => {
    const text = readText(file);
    return /(RabbitMQ|RabbitMq|IEventPublisher|BasicConsume|BasicPublish|QueueDeclare|ExchangeDeclare|consumerTag|routingKey|Subscribe|Consumer)/i.test(text);
  });
  let rabbitStatus = '[Missing]';
  if (rabbitSignals.some(file => /(BasicConsume|BasicPublish|QueueDeclare|ExchangeDeclare)/i.test(readText(file)))) {
    rabbitStatus = '[Compliant]';
  } else if (rabbitSignals.length) {
    rabbitStatus = '[Partial]';
  }
  requirements.push(createRequirement(
    'REQ-04',
    'RabbitMQ messaging topology is implemented',
    'Messaging',
    rabbitStatus,
    rabbitSignals.map(file => toRelative(root, file)).slice(0, 10),
    'The audit should find real message handlers, subscribers, or queue/exchange declarations rather than generic RabbitMQ mentions.'
  ));

  const ttlSignals = allFiles.filter(file => {
    const text = readText(file);
    return /(AbsoluteExpirationRelativeToNow|SetAbsoluteExpiration|SetSlidingExpiration|TimeSpan\.From(Minutes|Seconds)\(\d+\)|TTL|TimeToLive|CacheOptions|cache policy)/i.test(text);
  });
  let ttlStatus = '[Missing]';
  if (ttlSignals.some(file => /(AbsoluteExpirationRelativeToNow|SetAbsoluteExpiration|SetSlidingExpiration|TimeSpan\.From(Minutes|Seconds)\(\d+\))/i.test(readText(file)))) {
    ttlStatus = '[Compliant]';
  } else if (ttlSignals.length) {
    ttlStatus = '[Partial]';
  }
  requirements.push(createRequirement(
    'REQ-05',
    'Redis TTL policy is explicitly configured',
    'Caching',
    ttlStatus,
    ttlSignals.map(file => toRelative(root, file)).slice(0, 10),
    'Cache logic should enforce a concrete TTL policy such as 10 minutes or an explicit expiration strategy.'
  ));

  const healthHits = allFiles.filter(file => {
    const text = readText(file);
    return /\/health|HealthCheck|MapHealthChecks/i.test(text);
  });
  requirements.push(createRequirement(
    'REQ-06',
    'Health endpoints are exposed',
    'Observability',
    healthHits.length ? '[Compliant]' : '[Missing]',
    healthHits.map(file => toRelative(root, file)).slice(0, 10),
    'Every service should expose a health endpoint for readiness and dependency checks.'
  ));

  const correlationHits = allFiles.filter(file => {
    const text = readText(file);
    return /correlation|CorrelationId|x-correlation-id/i.test(text);
  });
  requirements.push(createRequirement(
    'REQ-07',
    'Correlation ID propagation is implemented',
    'Observability',
    correlationHits.length >= 2 ? '[Compliant]' : (correlationHits.length ? '[Partial]' : '[Missing]'),
    correlationHits.map(file => toRelative(root, file)).slice(0, 10),
    'Incoming requests should carry a correlation ID through the gateway and downstream services.'
  ));

  const dockerComposePath = path.join(root, 'docker-compose.yml');
  const dockerText = readText(dockerComposePath);
  requirements.push(createRequirement(
    'REQ-08',
    'Container health conditions are declared',
    'Infrastructure',
    /condition:\s*service_healthy|healthcheck/i.test(dockerText) ? '[Compliant]' : (fs.existsSync(dockerComposePath) ? '[Partial]' : '[Missing]'),
    fs.existsSync(dockerComposePath) ? ['docker-compose.yml'] : [],
    'Service dependencies should be declared with healthy conditions in Docker Compose.'
  ));

  const endpointEvidence = [];
  const endpointMatches = new Set();
  for (const file of [...bffFiles, ...serviceFiles]) {
    const text = readText(file);
    if (/\/auth\/(login|register)/i.test(text)) {
      endpointMatches.add('auth');
      endpointEvidence.push(toRelative(root, file));
    }
    if (/\/jobs\b|\/Jobs\b/i.test(text)) {
      endpointMatches.add('jobs');
      endpointEvidence.push(toRelative(root, file));
    }
    if (/aggregate\/kanban/i.test(text)) {
      endpointMatches.add('kanban');
      endpointEvidence.push(toRelative(root, file));
    }
    if (/api\/Applications|\[HttpPost\]|MapPost/i.test(text)) {
      endpointMatches.add('applications');
      endpointEvidence.push(toRelative(root, file));
    }
  }

  let endpointStatus = '[Missing]';
  if (endpointMatches.size >= 4) {
    endpointStatus = '[Compliant]';
  } else if (endpointMatches.size >= 2) {
    endpointStatus = '[Partial]';
  }
  requirements.push(createRequirement(
    'REQ-09',
    'Course-required service endpoints are implemented',
    'API Routes',
    endpointStatus,
    Array.from(new Set(endpointEvidence)).slice(0, 10),
    'The BFF and .NET services should expose auth, jobs, kanban, and application submission routes that match the course requirements.'
  ));

  const serviceEndpointFiles = [...bffFiles, ...serviceFiles].filter(file => {
    const text = readText(file);
    return /\/auth\/(login|register)|\/jobs\b|aggregate\/kanban|api\/Applications|\[HttpPost\]|MapPost/i.test(text);
  });
  requirements.push(createRequirement(
    'REQ-10',
    'Mandatory course entry points are discoverable in controllers',
    'API Discovery',
    serviceEndpointFiles.length ? '[Compliant]' : '[Missing]',
    serviceEndpointFiles.map(file => toRelative(root, file)).slice(0, 10),
    'The required endpoints should be visible in controller or route registration code rather than hidden in unrelated utilities.'
  ));

  const summary = { compliant: 0, partial: 0, missing: 0 };
  for (const req of requirements) {
    if (req.status === '[Compliant]') summary.compliant += 1;
    if (req.status === '[Partial]') summary.partial += 1;
    if (req.status === '[Missing]') summary.missing += 1;
  }

  return { requirements, summary };
}

function buildReport(audit) {
  const lines = [];
  lines.push('# JobConnect Compliance Report');
  lines.push('');
  lines.push('Generated by: scripts/compliance_audit.js');
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`- Overall status: ${audit.summary.compliant} compliant, ${audit.summary.partial} partial, ${audit.summary.missing} missing`);
  lines.push('- The audit inspects the local repository structure under src/gateway/BFF, src/services, backend/shared, and the top-level container configuration.');
  lines.push('- Findings are based on repository file presence and text matching rather than a direct fetch of the external teacher requirements repository.');
  lines.push('');
  lines.push('## Parsed Requirements Summary');
  lines.push('');
  for (const req of audit.requirements) {
    lines.push(`- ${req.id} | ${req.title} | ${req.status} | ${req.notes}`);
  }
  lines.push('');
  lines.push('## Findings by Category');
  lines.push('');
  for (const label of ['[Compliant]', '[Partial]', '[Missing]']) {
    lines.push(`### ${label}`);
    lines.push('');
    const items = audit.requirements.filter(req => req.status === label);
    if (!items.length) {
      lines.push('- None');
    } else {
      for (const item of items) {
        const evidence = item.evidence.length ? item.evidence.slice(0, 3).join(', ') : 'No direct evidence';
        lines.push(`- ${item.id} - ${item.title} (${evidence})`);
      }
    }
    lines.push('');
  }
  lines.push('## Evidence Matrix');
  lines.push('');
  lines.push('| Requirement | Status | Evidence | Notes |');
  lines.push('| --- | --- | --- | --- |');
  for (const req of audit.requirements) {
    const evidence = req.evidence.length ? req.evidence.slice(0, 3).join(', ') : 'No direct evidence';
    lines.push(`| ${req.title} | ${req.status} | ${evidence} | ${req.notes} |`);
  }
  lines.push('');
  lines.push('## Recommended Remediation Plan');
  lines.push('');
  lines.push('1. Review the highest-priority gaps and implement the missing architecture pieces in the relevant service or gateway files.');
  lines.push('2. Add or strengthen explicit RabbitMQ, Redis TTL, correlation ID, and health endpoint implementation where the audit reports partial coverage.');
  lines.push('3. Keep the changes aligned with the repository guidance in .github/copilot-instructions.md and the existing service boundaries.');
  lines.push('');
  return lines.join('\n');
}

const audit = buildAudit(repoRoot);
const report = buildReport(audit);
fs.writeFileSync(outputPath, report, 'utf8');
console.log(`Audit complete. Report written to ${path.relative(repoRoot, outputPath) || outputPath}`);
console.log(`Summary: compliant=${audit.summary.compliant} partial=${audit.summary.partial} missing=${audit.summary.missing}`);
