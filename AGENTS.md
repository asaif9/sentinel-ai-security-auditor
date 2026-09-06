# Sentinel AI Autonomous Agent Framework

This document outlines the architecture, specifications, coordination protocols, tool calling mechanisms, and lifecycle of the autonomous multi-agent security system powering **Sentinel AI Security Auditor**.

---

## 1. System Architecture & Philosophy

The Sentinel AI agent ecosystem utilizes a **hierarchical multi-agent architecture** coordinated by a central orchestrator (**Sentinel-Prime**) that delegates domain-specific security assessments to nine specialized sub-agents. 

The framework operates under strict **Zero-Trust AppSec Principles**:
- **Zero Secrets in Client Code**: All model reasoning, crawler orchestration, credential resolution, and tool execution are executed exclusively server-side.
- **Auditable State**: Every task phase, step transition, message dispatch, tool execution trace, and vulnerability finding is persisted in Google Cloud Firestore.
- **Self-Evolving Test Generation**: Once initial vulnerability patterns are established, the orchestrator triggers an automated pattern-discovery loop to synthesize compound, multi-stage exploit chains.
- **Model Context Protocol (MCP) Tool Calling**: Agents execute granular tools defined using standard `@google/genai` function declarations (`server/agentTools.ts`) and orchestrated via `server/mcpOrchestrator.ts`.

---

## 2. Agent Roster & Specializations

| Agent ID | Role | Specialization | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Sentinel-Prime** | Primary Orchestrator | Strategic Security Coordination | Request triage, task decomposition, sub-agent coordination, self-evolution loop execution, threat journal analysis, and executive report synthesis. |
| **Infiltrator-X** | Sub-Agent | IDOR & SSRF Fuzzing | Insecure Direct Object Reference testing, parameter tampering, blind SSRF, metadata endpoint discovery (AWS/GCP), and authorization bypass probing (`run_idor_fuzz`). |
| **Ghost-Scan** | Sub-Agent | OWASP Top 10 Scanning | Broad automated scanning across OWASP Top 10 categories (SQLi, XSS, CSRF, Open Redirects, CORS, Security Misconfigurations) (`run_owasp_scan`). |
| **Vuln-Hunter** | Sub-Agent | Vulnerability Analysis | Verification of candidate vulnerabilities, exploit viability validation, reproduction PoC confirmation, and severity triage (`verify_vulnerability_exploit`). |
| **QA-Expert** | Sub-Agent | Security Automation | Playwright/automated script generation, test coverage gap identification, and regression verification. |
| **AppSec-Engineer** | Sub-Agent | Application Security & Remediation | Source code review simulation, production-ready unified Git diff patch synthesis across Express, FastAPI, Spring Boot, and Next.js (`server/patchSynthesizer.ts`). |
| **Cloud-Sentry** | Sub-Agent | Cloud Security | Cloud metadata SSRF, misconfigured storage buckets (S3/GCS), IAM role escalation risks, and secret exposure analysis. |
| **API-Guardian** | Sub-Agent | API Security | Broken Object Level Authorization (BOLA), mass assignment, JWT token manipulation, and rate limiting validation (`simulate_jwt_tamper`). |
| **Crypto-Cracker** | Sub-Agent | Cryptography | Weak cipher suites (SSLv3/RC4), outdated hashing algorithms (MD5/SHA1), cookie security flags, timing attacks, and JWT algorithm none attacks (`simulate_jwt_tamper`). |
| **Deep-Crawler** | Sub-Agent | Deep Web Crawling | Dynamic asset discovery, crawling endpoints via Scrapy (high-throughput static DOM) and Crawl4AI (headless Chromium for SPA, MFA, and complex state flows) (`trigger_crawl`). |

---

## 3. Tool Declarations & MCP Function Calling

Sub-agents invoke tools declared in `server/agentTools.ts` via standard `@google/genai` function declarations:

### 1. `trigger_crawl` (Deep-Crawler)
- **Description**: Triggers deep asset and endpoint discovery on target URLs.
- **Parameters**: `url` (string, required), `engine` ("scrapy" | "crawl4ai" | "auto"), `depth` (number), `testCaseId` (string).
- **Executor**: `executeTriggerCrawl` spawns Python crawler (`crawler.py`) or returns simulated discovery records with risk scoring (0–100) and vulnerability hints.

### 2. `run_idor_fuzz` (Infiltrator-X)
- **Description**: Probes endpoints for Insecure Direct Object Reference and cross-tenant authorization leaks.
- **Parameters**: `target` (string, required), `param` (string, required), `userId` (string), `method` ("GET" | "POST" | "PUT" | "DELETE").
- **Executor**: `executeRunIdorFuzz` tests user ID substitution and verifies tenant boundary enforcement.

### 3. `simulate_jwt_tamper` (API-Guardian / Crypto-Cracker)
- **Description**: Simulates JWT cryptographic and claim manipulation attacks.
- **Parameters**: `targetUrl` (string, required), `tamperType` ("none_alg" | "role_escalation" | "weak_secret" | "expired_signature", required), `token` (string).
- **Executor**: `executeSimulateJwtTamper` generates forged tokens and evaluates server response status.

### 4. `run_owasp_scan` (Ghost-Scan)
- **Description**: Probes targets against OWASP Top 10 vulnerability categories.
- **Parameters**: `targetUrl` (string, required), `vector` ("open_redirect" | "xss" | "sqli" | "cors" | "cmd_injection", required), `params` (object).
- **Executor**: `executeRunOwaspScan` injects fuzz payloads and evaluates reflection, syntax breaking, and origin headers.

### 5. `verify_vulnerability_exploit` (Vuln-Hunter)
- **Description**: Validates candidate vulnerabilities for reproducible exploitation.
- **Parameters**: `vulnerabilityId` (string, required), `exploitType` (string, required), `targetEndpoint` (string, required), `payload` (string).
- **Executor**: `executeVerifyVulnerabilityExploit` issues simulated exploit payloads and outputs reproducible curl PoCs.

### Tool Execution Traces
Every tool execution outputs a `ToolExecutionTrace` contract:
```typescript
interface ToolExecutionTrace {
  id: string;
  agent: string;
  subAgent: string;
  action: string;
  toolName: string;
  args: Record<string, any>;
  result: Record<string, any>;
  summary: string;
  timestamp: string;
  status: "success" | "warning" | "exploited";
}
```
Traces are streamed to the frontend and rendered in real time in the `McpTraceTerminal` component.

---

## 4. Workflow & Lifecycle Phases

```
[User Request / Audit Target]
              │
              ▼
    ┌──────────────────┐
    │  Sentinel-Prime  │ ◄─── Phase 1: Strategic Analysis & Reasoning (Gemini Pro)
    └─────────┬────────┘
              │
              ├────── Phase 2: Task Decomposition & Sub-Agent Delegation
              ▼
  ┌───────────────────────┐
  │ Specialized Sub-Agents│ ◄─── Phase 3: Autonomous Tool Calling & Crawling
  │ (Ghost-Scan, etc.)    │      (Scrapy / Crawl4AI + Agent Tools)
  └───────────┬───────────┘
              │
              ▼
    ┌──────────────────┐
    │  Self-Evolution  │ ◄─── Phase 4: Pattern Discovery & Dynamic Exploit Chaining
    │      Loop        │      (Synthesizes compound exploit chains)
    └─────────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │  Consolidation   │ ◄─── Phase 5: Structured Report, Remediation Patches & Alerts
    │   & Remediation  │      (Unified Git Diffs, PDF/JSON export, Real-time Alerting)
    └──────────────────┘
```

### Phase 1: Strategic Request Triage & Reasoning
- A task document is created in Firestore (`/tasks`) with structured lifecycle steps:
  1. `Initialize MCP Orchestration`
  2. `Autonomous Tool Calling & Fuzzing`
  3. `Self-Evolution Exploitation`
  4. `Report Consolidation`
- Sentinel-Prime invokes the Gemini model (`gemini-3.1-pro-preview`) with tool declarations to formulate an assessment plan.

### Phase 2: Task Decomposition & Delegation
- Sub-agent tasks are registered in Firestore with `assignedAgentId` and tracked through operational states (`pending`, `in-progress`, `completed`, `failed`).
- Work directives are broadcast via the `messages` collection.

### Phase 3: Crawling & Attack Simulation
- `Deep-Crawler` triggers dynamic crawling (`/api/crawler/run` or tool `trigger_crawl`):
  - **Scrapy**: High-throughput static page parsing across HTML anchor tags (~240 req/s).
  - **Crawl4AI**: Headless Chromium browser automation evaluating dynamic SPA state transitions, multi-step MFA challenge steps, and hidden client-side routes.
- Sub-agents invoke respective tools (`run_idor_fuzz`, `simulate_jwt_tamper`, `run_owasp_scan`) to identify vulnerabilities.

### Phase 4: Self-Evolution Loop
- Sentinel-Prime analyzes individual vulnerability findings to detect compound exploit chains.
- Combines multiple lower-severity findings into critical-impact chains (e.g., combining an Open Redirect with an OAuth callback handler to execute Account Takeover).
- Generated findings are tagged with `isEvolved: true` and rendered with step-by-step Gemini reasoning steps in `SynthesizedExploitChainCard`.

### Phase 5: Consolidation, Patches & Alert Dispatch
- Findings are consolidated into an executive summary.
- AppSec-Engineer synthesizes unified Git diff patches (`/api/agents/generate-patch`) with bypass prevention rationale.
- Critical and High findings trigger real-time notifications in `/alerts`.

---

## 5. AppSec Patch Synthesizer (`AppSec-Engineer`)

The patch synthesis engine (`server/patchSynthesizer.ts`) generates production-ready code remedies across major application frameworks:
- **Supported Frameworks**: Node.js / Express, Python / FastAPI, Java / Spring Boot, TypeScript / Next.js.
- **Requirements Enforced**:
  1. Valid Unified Git Diff (`--- a/...` and `+++ b/...`).
  2. Architectural justification for why bypasses are neutralized (e.g., regex boundary anchors, constant-time equality comparisons, parameterized queries).
  3. List of specific bypass techniques prevented.
  4. Automated unit test / verification code snippet.

---

## 6. Threat Journal & Architectural Threat Modeling

Architects can log design notes, webhook architectures, and authentication workflows in the **Architect's Threat Journal** (`src/components/ThreatJournal.tsx` & `server.ts`):
- **Prompt Injection Firebreak**: Ingress payloads pass through `promptInjectionFirebreakMiddleware` to neutralize adversarial prompt injection and DAN jailbreaks.
- **Ephemeral Redaction (Data Minimization)**: Automatically scrubs emails, bearer tokens, API keys, and IP addresses before model invocation, restoring placeholders in the response.
- **STRIDE & OWASP Mapping**: Analyzes designs against STRIDE categories and OWASP Top 10 risks.
- **Persistence**: Persisted to the `/threat_journal` collection in Firestore.

---

## 7. Persistence & Firestore Schemas

All agent data operates against the schema defined in `firebase-blueprint.json` and secured by `firestore.rules`:
- `/agents/{agentId}`: Agent operational status (`idle`, `active`, `offline`), role, and heartbeat.
- `/tasks/{taskId}`: Task status, steps, tool traces, and findings.
- `/vulnerabilities/{vulnId}`: Vulnerability findings, OWASP taxonomy, PoC requests/responses, and remediation.
- `/alerts/{alertId}`: Real-time threat alerts feed.
- `/users/{userId}/alerts/{alertId}`: Tenant-partitioned security alerts (including blocked adversarial prompt attempts).
- `/messages/{messageId}`: Inter-agent message bus.
- `/threat_journal/{journalId}`: Architectural threat assessments.

---

## 8. Flow AI Conversational Attack Flow Planner

In addition to autonomous background audits, Sentinel AI provides an interactive conversational attack planning interface (**Flow AI**, powered by `FlowAIChatDrawer.tsx` and `server/flowSyncEngine.ts`):
- **Adversarial Intent Translation**: Engineers describe complex security scenarios (or select from curated high-impact templates), and the engine synthesizes:
  1. A structured 4-phase adversarial penetration test plan with clear exploit hypotheses.
  2. An interactive ReactFlow node graph connecting entry points, authorization gates, services, and exploit nodes.
  3. Realistically simulated high-severity vulnerabilities (CVSS 8.8–9.4) with reproducible `curl` PoCs.
  4. Direct handoff to `AppSec-Engineer` for one-click unified Git diff patch synthesis.
- **Curated Dynamic Scenarios**:
  - `oauth_ato`: OAuth 2.0 State Injection & Account Takeover (CVSS 9.4).
  - `ssrf_cloud`: Blind SSRF to Cloud Metadata (169.254.169.254) & AWS IAM STS Key Theft (CVSS 9.1).
  - `bola_exfiltration`: BOLA / IDOR Cross-Tenant PII & Invoice Exfiltration (CVSS 9.2).
  - `jwt_none_privilege`: JWT `alg: none` Signature Stripping & SuperAdmin Escalation (CVSS 9.0).
  - `file_upload_rce`: Unrestricted Polyglot File Upload to Remote Code Execution (CVSS 9.8).
  - `sqli_schema_dump`: Dynamic SQL Injection Catalog Search & Database Dump (CVSS 8.8).

---

## 9. Server API Endpoints Supporting Agents

- `POST /api/agents/mcp-audit`: Full autonomous multi-agent MCP audit orchestration.
- `POST /api/agents/tools/:toolName`: Direct tool execution endpoints (`crawl`, `idor-fuzz`, `jwt-tamper`, `owasp-scan`, `verify-exploit`).
- `POST /api/agents/generate-patch`: AppSec-Engineer patch generation endpoint.
- `POST /api/crawler/run`: Dynamic web crawler execution (Scrapy / Crawl4AI).
- `GET /api/crawler/telemetry`: Crawler engine telemetry and risk distribution.
- `POST /api/flows/generate-from-text`: Text-to-ReactFlow visual flow generator.
- `POST /api/flows/chat-plan`: Conversational attack flow planner & high-severity vulnerability finder.
- `GET /api/flows/scenarios`: Predefined dynamic attack scenarios listing.
- `POST /api/flows/audit`: Flow-to-Audit adversarial injection simulation.
- `POST /api/security/threat-journal/analyze`: Sentinel-Prime threat journal analyzer with Ephemeral Redaction.
- `POST /api/security/test-multitenancy`: 6-step multi-tenant zero-trust isolation verification.
