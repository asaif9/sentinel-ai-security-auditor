# Sentinel AI Autonomous Agent Framework: Specifications & Operating Manual

> **Authoritative Technical Specification & Operating Manual for the Sentinel AI Multi-Agent Security Mesh, Model Context Protocol (MCP) Tool Calling, Autonomous Fuzzing, Architectural Threat Modeling, and Patch Synthesis.**

---

## 1. System Overview & Architectural Philosophy

The **Sentinel AI Security Auditor** autonomous agent ecosystem operates on a **hierarchical multi-agent architecture** coordinated by a central orchestrator (**Sentinel-Prime**) that manages, delegates to, and correlates findings from nine domain-specialized sub-agents.

```
                    ┌─────────────────────────────────────────┐
                    │              Sentinel-Prime             │
                    │        (Primary AI Orchestrator)        │
                    │   Gemini 3.8 Flash / Gemini 3.1 Pro     │
                    └────────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌───────────────┐               ┌─────────────────┐               ┌───────────────┐
│ Dynamic Crawl │               │  Targeted Fuzz  │               │  Verification │
│  & Discovery  │               │  & Exploitation │               │  & Patching   │
├───────────────┤               ├─────────────────┤               ├───────────────┤
│ Deep-Crawler  │               │ Infiltrator-X   │               │ Vuln-Hunter   │
│ (Scrapy &     │               │ Ghost-Scan      │               │ AppSec-Eng    │
│  Crawl4AI)    │               │ API-Guardian    │               │ QA-Expert     │
└───────────────┘               │ Crypto-Cracker  │               └───────────────┘
                                │ Cloud-Sentry    │
                                └─────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │          Self-Evolution Loop            │
                    │  (Synthesizes Compound Exploit Chains)  │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │       Persistence & Remediation         │
                    │  Firestore Traces + Unified Git Diffs   │
                    └─────────────────────────────────────────┘
```

### Core Operating Principles

1. **Zero Secrets in Client Code**: All Gemini model reasoning, token manipulation, crawling orchestration, and tool execution occur strictly server-side. Zero sensitive credentials or master API keys exist in browser bundles. Client configuration is restricted to public Firebase identifiers (`firebase-applet-config.json`).
2. **Model Context Protocol (MCP) Function Calling**: Agents invoke granular tools declared via official `@google/genai` function declarations (`server/agentTools.ts`), orchestrated through multi-turn tool calling loops in `server/mcpOrchestrator.ts`.
3. **Auditable & Observable State**: Every task transition, inter-agent message, tool execution trace, vulnerability finding, and architectural threat is logged to Google Cloud Firestore with real-time UI streaming.
4. **Self-Evolving Test Generation**: Phase 4 of an audit analyzes isolated findings to discover compound, multi-stage exploit chains (e.g., pairing open redirects with OAuth callback handlers to achieve Account Takeover).
5. **Actionable Remediation**: `AppSec-Engineer` synthesizes production-ready Unified Git Diffs across four major web frameworks (Express, FastAPI, Spring Boot, Next.js) with architectural justifications for bypass neutralization and automated unit verification tests.

---

## 2. Complete Agent Roster & Domain Specializations

| Agent ID | Tier | Specialization | Core Responsibilities & Primary Tool |
| :--- | :--- | :--- | :--- |
| **Sentinel-Prime** | Primary | Strategic Orchestration & Correlation | Request triage, task decomposition, model reasoning via Gemini (`gemini-3.8-flash`), sub-agent coordination, self-evolution exploit chaining, threat journal analysis, and executive reporting. |
| **Infiltrator-X** | Sub-Agent | IDOR & SSRF Fuzzing | Insecure Direct Object Reference testing, parameter tampering, horizontal/vertical privilege escalation, and authorization boundary bypass (`run_idor_fuzz`). |
| **Ghost-Scan** | Sub-Agent | OWASP Top 10 Scanning | Automated vulnerability scanning across SQLi, NoSQLi, XSS, CSRF, Open Redirects, CORS misconfigurations, and Command Injection (`run_owasp_scan`). |
| **Vuln-Hunter** | Sub-Agent | Exploit Verification & Validation | Exploit viability validation, proof-of-concept verification, CVSS v3.1 score calibration, and false-positive elimination (`verify_vulnerability_exploit`). |
| **QA-Expert** | Sub-Agent | Security Automation | Automated test scenario synthesis, Playwright regression script generation, and test coverage gap identification. |
| **AppSec-Engineer** | Sub-Agent | Application Remediation | Source code review simulation, Unified Git Diff patch synthesis, bypass prevention rationale, and automated unit verification tests (`generateAppSecPatch`). |
| **Cloud-Sentry** | Sub-Agent | Cloud Security | Cloud instance metadata SSRF (`169.254.169.254`), misconfigured storage buckets (S3/GCS), and IAM privilege escalation auditing. |
| **API-Guardian** | Sub-Agent | API Security & Authorization | Broken Object Level Authorization (BOLA/BFLA), mass assignment, JWT token manipulation, and rate limiting validation (`simulate_jwt_tamper`). |
| **Crypto-Cracker** | Sub-Agent | Cryptography & Ciphers | Weak SSL/TLS ciphers, outdated hashing algorithms (MD5/SHA1), cookie security flags, timing attacks, and JWT algorithm `none` attacks (`simulate_jwt_tamper`). |
| **Deep-Crawler** | Sub-Agent | Dynamic Web Crawling | Endpoint traversal, static DOM link discovery (Scrapy), and headless Chromium SPA state machine exploration (Crawl4AI) (`trigger_crawl`). |

---

## 3. MCP Tool Declarations & Execution Engines

Sub-agents invoke tools declared in `server/agentTools.ts` using `@google/genai` function declarations:

### 1. `trigger_crawl` (Deep-Crawler)
- **Description**: Triggers deep asset and endpoint discovery across a target URL using Scrapy (static DOM) or Crawl4AI (dynamic SPA state machines).
- **Parameters**: 
  - `url` (string, required): Target base URL (e.g. `https://target.example.com`).
  - `engine` (string, optional): Crawler engine (`"scrapy"`, `"crawl4ai"`, or `"auto"`).
  - `depth` (number, optional): Traversal depth (typically 1 to 4).
  - `testCaseId` (string, optional): Specific security test case or focus category (e.g., `'idor'`, `'bola'`, `'mfa-bypass'`).
- **Implementation (`executeTriggerCrawl`)**: Spawns Python crawler (`crawler.py`) with selected engine flag or returns deterministic discovery records with path, HTTP method, risk score (0–100), risk level, parameter inspection, and fuzzing status.

### 2. `run_idor_fuzz` (Infiltrator-X)
- **Description**: Probes endpoints for Insecure Direct Object References (IDOR) and cross-tenant authorization leakage.
- **Parameters**:
  - `target` (string, required): API endpoint or resource path to fuzz (e.g., `/api/v1/users/102`).
  - `param` (string, required): Parameter name to fuzz (e.g., `'id'`, `'userId'`, `'tenantId'`).
  - `userId` (string, optional): Foreign user identifier to probe cross-tenant boundary access.
  - `method` (string, optional): Request verb (`"GET"`, `"POST"`, `"PUT"`, `"DELETE"`).
- **Implementation (`executeRunIdorFuzz`)**: Simulates user identifier substitution, checks for foreign tenant data reflection, and validates whether HTTP 403 Forbidden is properly enforced.

### 3. `simulate_jwt_tamper` (API-Guardian / Crypto-Cracker)
- **Description**: Simulates JWT cryptographic and claim manipulation attacks.
- **Parameters**:
  - `targetUrl` (string, required): Target API endpoint accepting authentication tokens.
  - `tamperType` (string, required): Attack vector (`"none_alg"` for signature stripping, `"role_escalation"` for claim elevation to admin, `"weak_secret"` for weak HMAC, or `"expired_signature"`).
  - `token` (string, optional): Existing sample JWT to tamper with.
- **Implementation (`executeSimulateJwtTamper`)**: Generates crafted tokens with manipulated headers (e.g. `{"alg": "none"}`), elevated claims (`{"role": "admin"}`), or stripped signatures, and evaluates server acceptance.

### 4. `run_owasp_scan` (Ghost-Scan)
- **Description**: Automated vulnerability probe across OWASP Top 10 categories.
- **Parameters**:
  - `targetUrl` (string, required): Target endpoint to audit.
  - `vector` (string, required): Attack vector (`"open_redirect"`, `"xss"`, `"sqli"`, `"cors_misconfig"`, `"command_injection"`).
- **Implementation (`executeRunOwaspScan`)**: Injects targeted fuzz payloads, checks response status codes (e.g., HTTP 302 redirects to external domains for open redirects), tests reflection boundaries, and evaluates CORS headers.

### 5. `verify_vulnerability_exploit` (Vuln-Hunter)
- **Description**: Confirms vulnerability viability, filters false positives, and formulates a concrete exploit proof-of-concept (PoC).
- **Parameters**:
  - `vulnerabilityType` (string, required): Class of vulnerability identified (e.g., `'Unvalidated Open Redirect'`, `'BOLA / IDOR Cross-Tenant Leakage'`).
  - `targetUrl` (string, required): Target vulnerable endpoint.
  - `payload` (string, required): Verified exploit payload or proof-of-concept string.
  - `proofDetails` (string, required): Evidence demonstrating why the vulnerability is genuine and exploitable.
- **Implementation (`executeVerifyVulnerabilityExploit`)**: Issues simulated exploit requests, verifies impact, calculates calibrated CVSS v3.1 scores, and formats reproducible `curl` commands.

### Tool Execution Trace Schema
Every tool execution outputs a standardized `ToolExecutionTrace` contract:
```typescript
interface ToolExecutionTrace {
  id: string;
  agent: string;          // Calling orchestrator ("Sentinel-Prime")
  subAgent: string;       // Executing sub-agent (e.g. "Ghost-Scan")
  action: string;         // Human-readable action description
  toolName: string;       // Tool identifier ("run_owasp_scan")
  args: Record<string, any>;
  result: Record<string, any>;
  summary: string;        // High-level conclusion
  timestamp: string;      // ISO 8601 timestamp
  status: "success" | "warning" | "exploited";
}
```
Traces are streamed to the client and rendered in real time in `src/components/McpTraceTerminal.tsx`.

---

## 4. The 5-Phase Autonomous Audit Lifecycle

```
[Target URL / Audit Configuration]
               │
               ▼
    ┌───────────────────────┐
    │ Phase 1: Triage       │ ◄─── Sentinel-Prime reasons on target scope via Gemini Pro
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Phase 2: Delegation   │ ◄─── Decomposes scope into sub-tasks in /tasks Firestore collection
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Phase 3: Crawl & Fuzz │ ◄─── Deep-Crawler (Scrapy/Crawl4AI) + Infiltrator-X + Ghost-Scan
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Phase 4: Self-Evolve  │ ◄─── Correlates findings into compound exploit chains (isEvolved: true)
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Phase 5: Remediate    │ ◄─── AppSec-Engineer generates Git diffs + Executive Report + Alerts
    └───────────────────────┘
```

### Phase 1: Strategic Request Triage & Reasoning
- Sentinel-Prime initializes an audit task in Firestore (`/tasks`) with structured step milestones:
  1. `Initialize MCP Orchestration`
  2. `Autonomous Tool Calling & Fuzzing`
  3. `Self-Evolution Exploitation`
  4. `Report Consolidation`
- Sentinel-Prime initializes the Gemini client (`gemini-3.8-flash`) with all five tool declarations and formulates an initial assessment strategy.

### Phase 2: Task Decomposition & Delegation
- Sub-agent tasks are registered in Firestore with status transitions (`pending`, `in-progress`, `completed`, `failed`).
- Directives are broadcast across the `/messages` collection for auditable inter-agent communication.

### Phase 3: Crawling & Attack Simulation
- `Deep-Crawler` triggers dynamic asset discovery via `/api/crawler/run` or tool `trigger_crawl`:
  - **Scrapy Engine**: High-throughput static page parsing (~240 req/s) for broad endpoint mapping.
  - **Crawl4AI Engine**: Headless Chromium browser automation evaluating dynamic SPA state transitions, client-side routing, and multi-step MFA challenge flows.
- Discovered endpoints populate the D3-powered force-directed attack surface graph (`SitemapAttackSurfaceGraph`).
- Sub-agents invoke respective MCP tools (`run_owasp_scan`, `run_idor_fuzz`, `simulate_jwt_tamper`) up to 4 iterative model turns in `server/mcpOrchestrator.ts`.
- `Vuln-Hunter` validates positive candidates to filter false positives.

### Phase 4: Self-Evolution Loop (Compound Exploit Synthesis)
- Sentinel-Prime analyzes isolated vulnerability findings to identify chained attack paths.
- Synthesizes compound vulnerabilities combining multiple lower-risk flaws (e.g. Open Redirect + Permissive OAuth Callback Handler = Account Takeover).
- Evolved findings are tagged with `isEvolved: true` and rendered with step-by-step reasoning traces in `SynthesizedExploitChainCard`.

### Phase 5: Consolidation, Git Diff Patching & Alerts
- Findings are consolidated into an Executive Summary and technical finding inventory.
- `AppSec-Engineer` generates framework-specific Unified Git Diff patches (`/api/agents/generate-patch`).
- Critical and High findings dispatch real-time notifications to `/alerts` and `/users/{userId}/alerts`.

---

## 5. AppSec Patch Synthesizer (`AppSec-Engineer`)

Located in `server/patchSynthesizer.ts`, this engine produces production-ready source code patches:

- **Supported Frameworks**:
  - **Node.js / Express**: Secure middleware, regex boundary anchors, `crypto.timingSafeEqual`, parameterized queries.
  - **Python / FastAPI**: Pydantic models, `Depends()` authentication dependencies, parameterized SQL.
  - **Java / Spring Boot**: Spring Security filter chains, `@PreAuthorize`, prepared statements.
  - **TypeScript / Next.js**: Route Handler guards, Zod schema validation, iron-session protection.
- **Enforced Standards**:
  1. Standard Unified Git Diff format (`--- a/...` and `+++ b/...`).
  2. Architectural justification explaining why bypasses are neutralized (e.g., regex boundary anchors, constant-time equality comparisons, parameterized queries).
  3. Enumeration of specific bypass techniques prevented (e.g., protocol-relative URLs, timing attacks, subdomain spoofing).
  4. Automated unit test snippet verifying the fix.

---

## 6. Visual Test Flow Architect & Flow AI Conversational Attack Planner

Located in `server/flowSyncEngine.ts`, `src/components/VisualTestBuilder.tsx`, and `src/components/FlowAIChatDrawer.tsx`:

- **Node Taxonomy**:
  - `UserInput`: Entry forms, login portals, search fields, upload endpoints.
  - `AuthGate`: JWT validation, session checkpoints, OAuth 2.0 PKCE gates, MFA challenges.
  - `APICall`: REST endpoints, GraphQL queries, webhook ingestion handlers.
  - `DatabaseQuery`: Relational SQL transactions, NoSQL queries, Firestore operations.
  - `CloudService`: Third-party services (Stripe, Twilio, AWS S3 / GCS, AWS IMDSv1).
  - `FuzzerNode`: Dedicated adversarial injection test points.
  - `ExploitNode`: Validated exploit execution and compromise confirmation.
- **Text-to-Flow Synthesis (`POST /api/flows/generate-from-text`)**: Converts natural language workflow descriptions into visual ReactFlow graphs with auto-layout coordinates.
- **Flow-to-Audit Simulation (`POST /api/flows/audit`)**: Traverses the node graph sequentially, injects simulated adversarial payloads into each node, measures latency, and outputs node-level verdicts (`VULNERABLE` vs `SECURE`).
- **Flow AI Conversational Attack Flow Planner (`POST /api/flows/chat-plan` & `FlowAIChatDrawer`)**:
  - **Conversational Reasoning Loop**: Security engineers discuss attack vectors interactively with Sentinel-Prime.
  - **Dynamic Penetration Test Synthesis**: The engine formulates a 4-phase attack plan (Ingress Probing, Boundary Decoupling, Exploitation, and Exfiltration), a customized ReactFlow graph, and 1–2 simulated high-severity vulnerabilities (CVSS 8.8–9.4) with reproducible `curl` commands.
  - **Predefined Dynamic Scenarios (`GET /api/flows/scenarios`)**:
    1. `oauth_ato`: OAuth 2.0 State Injection & Account Takeover (CVSS 9.4).
    2. `ssrf_cloud`: Blind SSRF to Cloud Metadata (169.254.169.254) & AWS IAM STS Key Theft (CVSS 9.1).
    3. `bola_exfiltration`: BOLA / IDOR Cross-Tenant PII & Invoice Exfiltration (CVSS 9.2).
    4. `jwt_none_privilege`: JWT `alg: none` Signature Stripping & SuperAdmin Escalation (CVSS 9.0).
    5. `file_upload_rce`: Unrestricted Polyglot File Upload to Remote Code Execution (CVSS 9.8).
    6. `sqli_schema_dump`: Dynamic SQL Injection Catalog Search & Database Dump (CVSS 8.8).
  - **Instant Canvas & Patch Integration**: Users can load the generated node graph directly into the canvas with one click (`Apply Flow to Canvas`) or trigger `AppSec-Engineer` to synthesize a Unified Git Diff patch (`Generate Git Patch`).

---

## 7. Architect's Threat Journal & Zero-Trust Guardrails

Located in `src/components/ThreatJournal.tsx` and `server.ts`:

- **Prompt Injection Firebreak**: Middleware (`promptInjectionFirebreakMiddleware`) and sanitization logic (`sanitizeJournalInput`) detect adversarial prompt injection and DAN jailbreaks, rejecting requests with HTTP 400 and logging alerts to `/users/{uid}/alerts`.
- **Ephemeral Redaction (Data Minimization)**: Automatically scrubs emails (`{{REDACTED_EMAIL_n}}`), bearer tokens/API keys (`{{REDACTED_BEARER_n}}`), and IP addresses (`{{REDACTED_IP_n}}`) before sending prompts to LLMs, restoring placeholders in the response.
- **STRIDE Threat Modeling**: Classifies architectural risks across Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege with OWASP Top 10 references.

---

## 8. Persistence & Firestore Security Schemas

All agent operations are secured via `firestore.rules` and structured according to `firebase-blueprint.json`:

- `/agents/{agentId}`: Agent operational status (`Idle`, `Active`, `Collaborating`, `Failed`), role, workload, and heartbeats.
- `/tasks/{taskId}`: Task status, steps, tool traces, and findings.
- `/vulnerabilities/{vulnId}`: Vulnerability findings, CVSS scores, reproduction PoCs, and remediation diffs.
- `/alerts/{alertId}`: Global threat alerts feed.
- `/users/{userId}/alerts/{alertId}`: Tenant-partitioned security alerts.
- `/users/{userId}/entries/{entryId}`: Tenant-partitioned analysis entries.
- `/messages/{messageId}`: Inter-agent messaging bus.
- `/threat_journal/{journalId}`: Architectural threat assessments.

---

## 9. Server API Endpoints Supporting Agents

| Endpoint | Method | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | Health status and server environment mode. |
| `/api/agents/mcp-audit` | POST | `promptFirebreak` | Multi-turn autonomous MCP audit orchestration. |
| `/api/agents/tools/crawl` | POST | None | Direct invocation of `trigger_crawl`. |
| `/api/agents/tools/idor-fuzz` | POST | None | Direct invocation of `run_idor_fuzz`. |
| `/api/agents/tools/jwt-tamper` | POST | None | Direct invocation of `simulate_jwt_tamper`. |
| `/api/agents/tools/owasp-scan` | POST | None | Direct invocation of `run_owasp_scan`. |
| `/api/agents/tools/verify-exploit` | POST | None | Direct invocation of `verify_vulnerability_exploit`. |
| `/api/agents/generate-patch` | POST | None | AppSec-Engineer patch generation endpoint. |
| `/api/crawler/run` | POST | None | Dual-engine crawler execution (Scrapy / Crawl4AI). |
| `/api/crawler/telemetry` | GET | None | Crawler telemetry, scenario findings, and risk distribution. |
| `/api/flows/generate-from-text` | POST | `promptFirebreak` | Text-to-ReactFlow visual flow synthesis. |
| `/api/flows/chat-plan` | POST | `promptFirebreak` | Conversational attack flow planner & high-severity vulnerability finder. |
| `/api/flows/scenarios` | GET | None | Curated dynamic attack scenarios catalog. |
| `/api/flows/audit` | POST | None | Step-by-step visual flow adversarial injection audit. |
| `/api/security/threat-journal/analyze` | POST | `promptFirebreak` | Threat journal analysis with Ephemeral Redaction. |
| `/api/security/threat-journal` | GET | None | Retrieve architectural threat journal entries. |
| `/api/security/threat-journal/:id` | DELETE | None | Delete an architectural threat entry. |
| `/api/journal/reflect` | POST | `promptFirebreak` | PersonalJournal reflection with AI Studio instructions & Ephemeral Redaction. |
| `/api/journal/entries` | GET | None | Retrieve user's isolated journal reflections (`/users/{uid}/entries`). |
| `/api/journal/entries/:id` | DELETE | None | Delete user's isolated journal reflection document. |
| `/api/security/constitution` | GET | None | Security constitution and cloud architecture specs. |
| `/api/security/secret-manager-proof` | GET | None | Verify zero client-side secret exposure and key provenance. |
| `/api/security/test-multitenancy` | POST | None | 6-step zero-trust multi-tenancy verification suite. |
| `/api/security/test-prompt-firebreak` | POST | `promptFirebreak` | Test adversarial prompt rejection. |
| `/api/alerts` | GET / POST | None | Global threat alerts feed. |
| `/api/users/:uid/alerts` | GET | None | Tenant-partitioned security alerts. |
| `/api/agents/register` | POST | None | Agent heartbeat and registration. |
| `/api/tasks/:taskId` | PATCH | None | Update task step status and execution logs. |
| `/api/tools/tasks` | GET / POST | None | Manage and query audit task records in Firestore. |

---

## 10. Zero-Trust Security Verification

The platform provides continuous proof of security through the automated 6-step verification suite (`POST /api/security/test-multitenancy`):

1. **Unauthenticated Rejection**: Unauthenticated requests without Bearer tokens are rejected with HTTP 401.
2. **Forged Token Rejection**: Malformed or forged tokens are rejected prior to any database read or model execution.
3. **Tenant Partition Isolation**: Writes to `/users/{current_uid}/entries` succeed strictly within the authorized partition.
4. **Cross-Tenant Block**: Cross-tenant queries to `/users/{foreign_uid}/entries` are blocked with `PERMISSION_DENIED` (HTTP 403).
5. **Prompt Injection Guardrail**: Pre-LLM sanitizer neutralizes adversarial prompt injection attempts and logs alerts.
6. **Zero Client Secrets**: Confirms that 0 secret keys exist in browser client code, with keys dynamically resolved from Google Cloud Secret Manager.
