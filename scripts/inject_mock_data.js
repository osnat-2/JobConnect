#!/usr/bin/env node

const fetchImpl = globalThis.fetch || require('node-fetch');

const baseUrl = process.env.BFF_URL || process.env.GATEWAY_URL || 'http://127.0.0.1:8080';
const headers = {
  'content-type': 'application/json',
  accept: 'application/json',
  authorization: 'Bearer mock-dev-token',
  'x-user-id': 'mock-user',
  'x-user-email': 'mock.user@example.com',
  'x-user-roles': 'Admin,Recruiter'
};

const jobTemplates = [
  {
    Title: 'Platform Reliability Engineer',
    Company: 'JobConnect Labs',
    Description: 'Help maintain a resilient end-to-end hiring platform with strong observability and automation.',
    Location: 'Remote - US',
    Category: 'Engineering',
    EmploymentType: 'FullTime',
    SalaryMin: 130000,
    SalaryMax: 175000,
    Requirements: ['C#', '.NET 8', 'RabbitMQ', 'PostgreSQL'],
    Tags: ['Backend', 'Platform', 'SRE'],
    IsActive: true
  },
  {
    Title: 'Senior Frontend Engineer',
    Company: 'Northwind Digital',
    Description: 'Design polished recruiting interfaces and improve the applicant experience across Angular screens.',
    Location: 'Remote - EU',
    Category: 'Engineering',
    EmploymentType: 'FullTime',
    SalaryMin: 120000,
    SalaryMax: 160000,
    Requirements: ['Angular', 'TypeScript', 'Testing'],
    Tags: ['Frontend', 'UI', 'Angular'],
    IsActive: true
  },
  {
    Title: 'Product Designer',
    Company: 'Northwind AI',
    Description: 'Own candidate experience flows and design recruiting journeys that feel effortless.',
    Location: 'New York, NY',
    Category: 'Design',
    EmploymentType: 'FullTime',
    SalaryMin: 110000,
    SalaryMax: 150000,
    Requirements: ['Figma', 'UX Research', 'Design Systems'],
    Tags: ['UX', 'Design', 'Product'],
    IsActive: true
  },
  {
    Title: 'Recruiting Operations Specialist',
    Company: 'Fabrikam Talent',
    Description: 'Coordinate interview pipelines and keep hiring metrics consistent and actionable.',
    Location: 'Austin, TX',
    Category: 'Operations',
    EmploymentType: 'FullTime',
    SalaryMin: 70000,
    SalaryMax: 95000,
    Requirements: ['Coordination', 'Excel', 'Process Improvement'],
    Tags: ['Recruiting', 'Ops'],
    IsActive: true
  },
  {
    Title: 'Data Platform Engineer',
    Company: 'Adventure Works Data',
    Description: 'Make candidate and application data pipelines reliable, observable, and easy to evolve.',
    Location: 'Seattle, WA',
    Category: 'Data',
    EmploymentType: 'Contract',
    SalaryMin: 130000,
    SalaryMax: 170000,
    Requirements: ['Python', 'Kafka', 'Azure'],
    Tags: ['Data', 'Platform', 'Analytics'],
    IsActive: true
  },
  {
    Title: 'Machine Learning Engineer',
    Company: 'Contoso AI',
    Description: 'Build intelligent matching experiences and improve hiring recommendations for recruiters.',
    Location: 'Remote - US',
    Category: 'Engineering',
    EmploymentType: 'FullTime',
    SalaryMin: 150000,
    SalaryMax: 200000,
    Requirements: ['Python', 'PyTorch', 'MLOps'],
    Tags: ['AI', 'ML', 'Backend'],
    IsActive: true
  },
  {
    Title: 'People Operations Manager',
    Company: 'Woodgrove Software',
    Description: 'Lead a high-volume recruiting workflow and partner closely with hiring managers.',
    Location: 'Chicago, IL',
    Category: 'Operations',
    EmploymentType: 'FullTime',
    SalaryMin: 105000,
    SalaryMax: 140000,
    Requirements: ['Leadership', 'HRIS', 'Stakeholder Management'],
    Tags: ['People Ops', 'Leadership'],
    IsActive: true
  },
  {
    Title: 'Security Engineer',
    Company: 'Litware Security',
    Description: 'Secure the applicant workflow and protect employee and candidate data end to end.',
    Location: 'Remote - CA',
    Category: 'Engineering',
    EmploymentType: 'FullTime',
    SalaryMin: 145000,
    SalaryMax: 190000,
    Requirements: ['Cloud Security', 'IAM', 'Threat Modeling'],
    Tags: ['Security', 'Cloud', 'Platform'],
    IsActive: true
  }
];

const candidateTemplates = [
  { FirstName: 'Maya', LastName: 'Chen', Email: 'maya.chen.seed@example.com', Phone: '+1-415-555-0123', ResumeFileName: 'maya-chen.pdf', ResumeUrl: 'https://example.com/resumes/maya-chen.pdf' },
  { FirstName: 'Liam', LastName: 'Patel', Email: 'liam.patel.seed@example.com', Phone: '+1-212-555-0188', ResumeFileName: 'liam-patel.pdf', ResumeUrl: 'https://example.com/resumes/liam-patel.pdf' },
  { FirstName: 'Nadia', LastName: 'Lopez', Email: 'nadia.lopez.seed@example.com', Phone: '+1-646-555-0144', ResumeFileName: 'nadia-lopez.pdf', ResumeUrl: 'https://example.com/resumes/nadia-lopez.pdf' },
  { FirstName: 'Owen', LastName: 'Miller', Email: 'owen.miller.seed@example.com', Phone: '+1-206-555-0111', ResumeFileName: 'owen-miller.pdf', ResumeUrl: 'https://example.com/resumes/owen-miller.pdf' },
  { FirstName: 'Priya', LastName: 'Singh', Email: 'priya.singh.seed@example.com', Phone: '+1-310-555-0133', ResumeFileName: 'priya-singh.pdf', ResumeUrl: 'https://example.com/resumes/priya-singh.pdf' },
  { FirstName: 'Daniel', LastName: 'Brooks', Email: 'daniel.brooks.seed@example.com', Phone: '+1-617-555-0176', ResumeFileName: 'daniel-brooks.pdf', ResumeUrl: 'https://example.com/resumes/daniel-brooks.pdf' },
  { FirstName: 'Sara', LastName: 'Kim', Email: 'sara.kim.seed@example.com', Phone: '+1-312-555-0149', ResumeFileName: 'sara-kim.pdf', ResumeUrl: 'https://example.com/resumes/sara-kim.pdf' },
  { FirstName: 'Ethan', LastName: 'Garcia', Email: 'ethan.garcia.seed@example.com', Phone: '+1-214-555-0137', ResumeFileName: 'ethan-garcia.pdf', ResumeUrl: 'https://example.com/resumes/ethan-garcia.pdf' },
  { FirstName: 'Aisha', LastName: 'Rahman', Email: 'aisha.rahman.seed@example.com', Phone: '+1-703-555-0118', ResumeFileName: 'aisha-rahman.pdf', ResumeUrl: 'https://example.com/resumes/aisha-rahman.pdf' },
  { FirstName: 'Noah', LastName: 'Thompson', Email: 'noah.thompson.seed@example.com', Phone: '+1-512-555-0104', ResumeFileName: 'noah-thompson.pdf', ResumeUrl: 'https://example.com/resumes/noah-thompson.pdf' },
  { FirstName: 'Jules', LastName: 'Martinez', Email: 'jules.martinez.seed@example.com', Phone: '+1-415-555-0162', ResumeFileName: 'jules-martinez.pdf', ResumeUrl: 'https://example.com/resumes/jules-martinez.pdf' },
  { FirstName: 'Rina', LastName: 'Okafor', Email: 'rina.okafor.seed@example.com', Phone: '+1-646-555-0182', ResumeFileName: 'rina-okafor.pdf', ResumeUrl: 'https://example.com/resumes/rina-okafor.pdf' }
];

function buildCandidatePayload(template, index) {
  const suffix = `${Date.now().toString(36)}-${index}`;
  const localPart = template.Email.split('@')[0];
  return {
    ...template,
    Email: `${localPart}+${suffix}@example.com`
  };
}

const statusFlow = ['Submitted', 'InReview', 'InterviewScheduled', 'Interviewed', 'Offer'];

function getEntityId(payload) {
  return payload?.id || payload?.Id || payload?.data?.id || payload?.data?.Id || null;
}

async function requestJson(path, options, label) {
  const start = Date.now();
  const response = await fetchImpl(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  });

  const elapsedMs = Date.now() - start;
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  console.log(`[${label}] ${response.status} ${response.statusText} (${elapsedMs}ms)`);
  if (payload) {
    console.log(JSON.stringify(payload, null, 2));
  }

  return { response, payload, elapsedMs };
}

async function main() {
  console.log(`Using BFF base URL: ${baseUrl}`);

  const createdJobs = [];
  for (const jobPayload of jobTemplates) {
    const createJobResult = await requestJson('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobPayload)
    }, `Create Job ${jobPayload.Title}`);

    const jobId = getEntityId(createJobResult.payload);
    if (!jobId) {
      throw new Error(`Job creation did not return a valid id for ${jobPayload.Title}.`);
    }

    createdJobs.push({ ...jobPayload, id: jobId });
  }

  const createdCandidates = [];
  for (const [index, candidateTemplate] of candidateTemplates.entries()) {
    const candidatePayload = buildCandidatePayload(candidateTemplate, index);
    const createCandidateResult = await requestJson('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(candidatePayload)
    }, `Create Candidate ${candidatePayload.FirstName} ${candidatePayload.LastName}`);

    const candidateId = getEntityId(createCandidateResult.payload);
    if (!candidateId) {
      throw new Error(`Candidate creation did not return a valid id for ${candidatePayload.FirstName} ${candidatePayload.LastName}.`);
    }

    createdCandidates.push({ ...candidatePayload, id: candidateId });
  }

  let applicationCount = 0;
  for (const [index, candidate] of createdCandidates.entries()) {
    const selectedJobs = createdJobs.filter((_, jobIndex) => jobIndex % 3 === index % 3 || jobIndex % 4 === index % 4);
    const applicationsToCreate = selectedJobs.slice(0, 2);

    for (const job of applicationsToCreate) {
      const applicationPayload = {
        CandidateId: candidate.id,
        JobId: job.id,
        Notes: `Seeded via mock injector for ${candidate.FirstName} ${candidate.LastName} to explore the ${job.Title} pipeline.`
      };

      const applicationResult = await requestJson('/api/applications', {
        method: 'POST',
        body: JSON.stringify(applicationPayload)
      }, `Submit Application ${candidate.FirstName} -> ${job.Title}`);

      if (applicationResult.response.status === 409) {
        console.log(`Application already exists for ${candidate.FirstName} -> ${job.Title}; skipping.`);
        continue;
      }

      const applicationId = getEntityId(applicationResult.payload);
      if (!applicationId) {
        throw new Error(`Application creation did not return a valid id for ${candidate.FirstName} -> ${job.Title}.`);
      }

      const status = statusFlow[(applicationCount + index) % statusFlow.length];
      await requestJson(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(status)
      }, `Advance ${candidate.FirstName} -> ${status}`);

      applicationCount += 1;
    }
  }

  console.log(`Seed complete: ${createdJobs.length} jobs, ${createdCandidates.length} candidates, ${applicationCount} applications.`);
}

main().catch((error) => {
  console.error('Mock data injection failed:', error.message);
  process.exitCode = 1;
});
