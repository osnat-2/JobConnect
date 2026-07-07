#!/usr/bin/env python3
import argparse
import re
import sys
from pathlib import Path
from typing import Dict, List

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT = REPO_ROOT / "compliance_report.md"
IGNORED_DIRS = {".git", "node_modules", "bin", "obj", "dist", "coverage", "__pycache__"}


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except FileNotFoundError:
        return ""


def walk_dir(path: Path) -> List[Path]:
    if not path.exists():
        return []

    files: List[Path] = []
    for child in path.iterdir():
        if child.is_dir():
            if child.name not in IGNORED_DIRS:
                files.extend(walk_dir(child))
        elif child.is_file():
            files.append(child)
    return files


def collect_relevant_files(root: Path) -> Dict[str, List[Path]]:
    result = {"bff": [], "services": [], "shared": []}
    for relative_path, bucket in [
        ("backend/src/gateway/BFF", "bff"),
        ("src/gateway/BFF", "bff"),
        ("backend/src/services", "services"),
        ("src/services", "services"),
        ("backend/shared", "shared"),
        ("shared", "shared"),
    ]:
        files = walk_dir(root / relative_path)
        if files:
            result[bucket].extend(files)
    return result


def to_relative(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def audit_repository(root: Path) -> Dict[str, object]:
    files = collect_relevant_files(root)
    bff_files = [p for p in files["bff"] if p.is_file() and p.suffix in {".js", ".ts", ".mjs", ".cjs"}]
    service_files = [p for p in files["services"] if p.is_file() and p.suffix in {".cs", ".csproj", ".json", ".yaml", ".yml"}]
    shared_files = [p for p in files["shared"] if p.is_file()]
    all_files = bff_files + service_files + shared_files

    requirements: List[Dict[str, object]] = []

    bff_entry_files = [p for p in bff_files if p.name in {"app.js", "server.js", "index.js"}]
    status = "[Compliant]" if bff_entry_files else "[Partial]" if bff_files else "[Missing]"
    requirements.append({
        "id": "REQ-01",
        "title": "Gateway/BFF entry points present",
        "category": "Gateway",
        "status": status,
        "evidence": [to_relative(root, p) for p in bff_entry_files[:5]] or ["src/gateway/BFF"],
        "notes": "The BFF should expose an entry point for API routing and request handling.",
    })

    service_projects = [p for p in service_files if p.suffix == ".csproj"]
    service_programs = [p for p in service_files if p.name == "Program.cs"]
    status = "[Compliant]" if service_projects and service_programs else "[Partial]" if service_files else "[Missing]"
    requirements.append({
        "id": "REQ-02",
        "title": "Microservice projects and entry points exist",
        "category": "Services",
        "status": status,
        "evidence": [to_relative(root, p) for p in service_projects[:5]] + [to_relative(root, p) for p in service_programs[:5]],
        "notes": "The repository should contain .NET services under src/services with startup code.",
    })

    required_shared_files = ["AuthorizationExtensions.cs", "ServiceBootstrapExtensions.cs", "UserContext.cs", "Shared.Infrastructure.csproj"]
    shared_hits = [to_relative(root, p) for p in shared_files if p.name in required_shared_files]
    status = "[Compliant]" if len(shared_hits) >= 3 else "[Partial]" if shared_hits else "[Missing]"
    requirements.append({
        "id": "REQ-03",
        "title": "Shared infrastructure exists",
        "category": "Shared Infrastructure",
        "status": status,
        "evidence": shared_hits or ["backend/shared"],
        "notes": "Shared infrastructure should hold common auth, bootstrap, and user context utilities.",
    })

    rabbit_signals = [p for p in all_files if re.search(r"(RabbitMQ|RabbitMq|IEventPublisher|BasicConsume|BasicPublish|QueueDeclare|ExchangeDeclare|consumerTag|routingKey|Subscribe|Consumer)", read_text(p), re.IGNORECASE)]
    if rabbit_signals and any(re.search(r"(BasicConsume|BasicPublish|QueueDeclare|ExchangeDeclare)", read_text(p), re.IGNORECASE) for p in rabbit_signals):
        status = "[Compliant]"
    elif rabbit_signals:
        status = "[Partial]"
    else:
        status = "[Missing]"
    requirements.append({
        "id": "REQ-04",
        "title": "RabbitMQ messaging topology is implemented",
        "category": "Messaging",
        "status": status,
        "evidence": [to_relative(root, p) for p in rabbit_signals[:10]],
        "notes": "The audit should find real message handlers, subscribers, or queue/exchange declarations rather than generic RabbitMQ mentions.",
    })

    ttl_signals = [p for p in all_files if re.search(r"(AbsoluteExpirationRelativeToNow|SetAbsoluteExpiration|SetSlidingExpiration|TimeSpan\\.From(Minutes|Seconds)\\(\\d+\\)|TTL|TimeToLive|CacheOptions|cache policy)", read_text(p), re.IGNORECASE)]
    if ttl_signals and any(re.search(r"(AbsoluteExpirationRelativeToNow|SetAbsoluteExpiration|SetSlidingExpiration|TimeSpan\\.From(Minutes|Seconds)\\(\\d+\\))", read_text(p), re.IGNORECASE) for p in ttl_signals):
        status = "[Compliant]"
    elif ttl_signals:
        status = "[Partial]"
    else:
        status = "[Missing]"
    requirements.append({
        "id": "REQ-05",
        "title": "Redis TTL policy is explicitly configured",
        "category": "Caching",
        "status": status,
        "evidence": [to_relative(root, p) for p in ttl_signals[:10]],
        "notes": "Cache logic should enforce a concrete TTL policy such as 10 minutes or an explicit expiration strategy.",
    })

    health_hits = [p for p in all_files if re.search(r"(/health|HealthCheck|MapHealthChecks)", read_text(p), re.IGNORECASE)]
    requirements.append({
        "id": "REQ-06",
        "title": "Health endpoints are exposed",
        "category": "Observability",
        "status": "[Compliant]" if health_hits else "[Missing]",
        "evidence": [to_relative(root, p) for p in health_hits[:10]],
        "notes": "Every service should expose a health endpoint for readiness and dependency checks.",
    })

    correlation_hits = [p for p in all_files if re.search(r"(correlation|CorrelationId|x-correlation-id)", read_text(p), re.IGNORECASE)]
    status = "[Compliant]" if len(correlation_hits) >= 2 else "[Partial]" if correlation_hits else "[Missing]"
    requirements.append({
        "id": "REQ-07",
        "title": "Correlation ID propagation is implemented",
        "category": "Observability",
        "status": status,
        "evidence": [to_relative(root, p) for p in correlation_hits[:10]],
        "notes": "Incoming requests should carry a correlation ID through the gateway and downstream services.",
    })

    docker_compose = root / "docker-compose.yml"
    docker_text = read_text(docker_compose)
    status = "[Compliant]" if re.search(r"condition:\s*service_healthy|healthcheck", docker_text, re.IGNORECASE) else "[Partial]" if docker_compose.exists() else "[Missing]"
    requirements.append({
        "id": "REQ-08",
        "title": "Container health conditions are declared",
        "category": "Infrastructure",
        "status": status,
        "evidence": ["docker-compose.yml"] if docker_compose.exists() else [],
        "notes": "Service dependencies should be declared with healthy conditions in Docker Compose.",
    })

    endpoint_evidence = []
    endpoint_matches = set()
    for path in bff_files + service_files:
        text = read_text(path)
        if re.search(r"/auth/(login|register)", text, re.IGNORECASE):
            endpoint_matches.add("auth")
            endpoint_evidence.append(to_relative(root, path))
        if re.search(r"/jobs\b|/Jobs\b", text, re.IGNORECASE):
            endpoint_matches.add("jobs")
            endpoint_evidence.append(to_relative(root, path))
        if re.search(r"aggregate/kanban", text, re.IGNORECASE):
            endpoint_matches.add("kanban")
            endpoint_evidence.append(to_relative(root, path))
        if re.search(r"api/Applications|\[HttpPost\]|MapPost", text, re.IGNORECASE):
            endpoint_matches.add("applications")
            endpoint_evidence.append(to_relative(root, path))

    if len(endpoint_matches) >= 4:
        status = "[Compliant]"
    elif len(endpoint_matches) >= 2:
        status = "[Partial]"
    else:
        status = "[Missing]"
    requirements.append({
        "id": "REQ-09",
        "title": "Course-required service endpoints are implemented",
        "category": "API Routes",
        "status": status,
        "evidence": list(dict.fromkeys(endpoint_evidence))[:10],
        "notes": "The BFF and .NET services should expose auth, jobs, kanban, and application submission routes that match the course requirements.",
    })

    controller_files = [p for p in bff_files + service_files if re.search(r"/auth/(login|register)|/jobs\b|aggregate/kanban|api/Applications|\[HttpPost\]|MapPost", read_text(p), re.IGNORECASE)]
    requirements.append({
        "id": "REQ-10",
        "title": "Mandatory course entry points are discoverable in controllers",
        "category": "API Discovery",
        "status": "[Compliant]" if controller_files else "[Missing]",
        "evidence": [to_relative(root, p) for p in controller_files[:10]],
        "notes": "The required endpoints should be visible in controller or route registration code rather than hidden in unrelated utilities.",
    })

    counts = {"[Compliant]": 0, "[Partial]": 0, "[Missing]": 0}
    for req in requirements:
        counts[req["status"]] += 1

    compliant = [req for req in requirements if req["status"] == "[Compliant]"]
    partial = [req for req in requirements if req["status"] == "[Partial]"]
    missing = [req for req in requirements if req["status"] == "[Missing]"]

    return {
        "requirements": requirements,
        "summary": {
            "compliant": counts["[Compliant]"],
            "partial": counts["[Partial]"],
            "missing": counts["[Missing]"],
        },
        "findings": {
            "[Compliant]": compliant,
            "[Partial]": partial,
            "[Missing]": missing,
        },
    }


def build_report(result: Dict[str, object]) -> str:
    requirements = result["requirements"]
    summary = result["summary"]
    findings = result["findings"]
    lines: List[str] = []
    lines.append("# JobConnect Compliance Report")
    lines.append("")
    lines.append("Generated by: scripts/compliance_audit.py")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append("")
    lines.append(f"- Overall status: {summary['compliant']} compliant, {summary['partial']} partial, {summary['missing']} missing")
    lines.append("- The audit inspects the local repository structure under src/gateway/BFF, src/services, backend/shared, and the top-level container configuration.")
    lines.append("- Findings are based on file presence and repository text matches rather than an external fetch of the teacher's requirements repository.")
    lines.append("")
    lines.append("## Parsed Requirements Summary")
    lines.append("")
    for req in requirements:
        lines.append(f"- {req['id']} | {req['title']} | {req['status']} | {req['notes']}")
    lines.append("")
    lines.append("## Findings by Category")
    lines.append("")
    for label in ["[Compliant]", "[Partial]", "[Missing]"]:
        lines.append(f"### {label}")
        lines.append("")
        items = findings[label]
        if not items:
            lines.append("- None")
        else:
            for req in items:
                evidence = ", ".join(req["evidence"][:3]) if req["evidence"] else "No direct evidence"
                lines.append(f"- {req['id']} - {req['title']} ({evidence})")
        lines.append("")
    lines.append("## Evidence Matrix")
    lines.append("")
    lines.append("| Requirement | Status | Evidence | Notes |")
    lines.append("| --- | --- | --- | --- |")
    for req in requirements:
        evidence = ", ".join(req["evidence"][:3]) if req["evidence"] else "No direct evidence"
        lines.append(f"| {req['title']} | {req['status']} | {evidence} | {req['notes']} |")
    lines.append("")
    lines.append("## Recommended Remediation Plan")
    lines.append("")
    lines.append("1. Review the highest-priority gaps and implement the missing architecture pieces in the relevant service or gateway files.")
    lines.append("2. Add or strengthen explicit RabbitMQ, Redis TTL, correlation ID, and health endpoint implementation where the audit reports partial coverage.")
    lines.append("3. Keep the changes aligned with the repository guidance in .github/copilot-instructions.md and the existing service boundaries.")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit the JobConnect repository against the local architecture checklist.")
    parser.add_argument("--root", default=str(REPO_ROOT), help="Path to the JobConnect repository root")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Markdown file to write")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output = Path(args.output).resolve()

    if not root.exists():
        print(f"Repository root does not exist: {root}", file=sys.stderr)
        return 2

    result = audit_repository(root)
    report = build_report(result)
    output.write_text(report, encoding="utf-8")

    print(f"Audit complete. Report written to {output}")
    print(f"Summary: compliant={result['summary']['compliant']} partial={result['summary']['partial']} missing={result['summary']['missing']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
