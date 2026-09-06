# Sentinel AI Security Auditor

> **Zero-Trust Autonomous AI AppSec Auditor, Threat Modeling Suite & Security Testing Mesh featuring automated deviation analysis, Model Context Protocol (MCP) tool-calling agents, visual flow auditing, dual-engine crawling, and unified Git diff patch synthesis.**

---

## 1. Overview

**Sentinel AI Security Auditor** is an enterprise-grade Application Security (AppSec) auditing platform powered by an autonomous hierarchical multi-agent ecosystem. It automates dynamic application security testing (DAST), vulnerability discovery, architectural threat modeling, compound exploit chain synthesis, behavioral drift analysis, and regression verification across modern web applications, APIs, and cloud services.

By combining Google Gemini models (`gemini-3.8-flash` for server-side MCP agent orchestration, patch synthesis, flow sync, and threat modeling, paired with `gemini-3.1-pro-preview` via the official `@google/genai` SDK), dual-engine web crawling (Scrapy and Crawl4AI), visual workflow modeling (ReactFlow), Model Context Protocol (MCP) function calling, and continuous drift deviation analysis, Sentinel AI provides an end-to-end security auditing lifecycle from initial discovery through production-ready Git diff remediation patches.

---

## 2. Core Architecture & Modules

### 🤖 1. Autonomous Multi-Agent Mesh & MCP Function Calling
- **Primary Orchestrator (Sentinel-Prime)**: Formulates assessment strategies, delegates sub-tasks, coordinates MCP tool calls, executes iterative self-evolution loops, and compiles executive summaries.
- **Nine Domain-Specialized Sub-Agents**:
  - `Infiltrator-X`: Insecure Direct Object Reference (IDOR) & SSRF fuzzing, parameter tampering, and authorization boundary probing (`run_idor_fuzz`).
  - `Ghost-Scan`: Broad OWASP Top 10 automated scanning (SQLi, NoSQLi, XSS, CSRF, Open Redirects, CORS, Command Injection) (`run_owasp_scan`).
  - `Vuln-Hunter`: Exploit viability validation, PoC confirmation, and false-positive elimination (`verify_vulnerability_exploit`).
  - `QA-Expert`: Automated test generation and Playwright regression script synthesis.
  - `AppSec-Engineer`: Source code review simulation and unified Git diff patch synthesis (`generateAppSecPatch`).
  - `Cloud-Sentry`: Cloud metadata SSRF (`169.254.169.254`) and cloud storage bucket exposure auditing.
  - `API-Guardian`: API authorization (BOLA/BFLA), mass assignment, and JWT manipulation (`simulate_jwt_tamper`).
  - `Crypto-Cracker`: SSL/TLS ciphers, hashing strengths, cookie security flags, and JWT algorithm `none` attacks (`simulate_jwt_tamper`).
  - `Deep-Crawler`: Dynamic link traversal and headless browser crawling (`trigger_crawl`).
- **Live Tool Execution Traces (`McpTraceTerminal`)**: Streaming execution terminal tracking sub-agent tool invocations, argument payloads, raw outputs, and execution statuses (`success`, `warning`, `exploited`).

### 🕸️ 2. Interactive Attack Surface Graph (`SitemapAttackSurfaceGraph`)
- Interactive D3-powered force-directed graph mapping discovered target endpoints.
- Displays risk scores (0–100), risk levels (`Critical`, `High`, `Medium`, `Low`, `Clean`), parameter inspection, fuzzing statuses, and crawler provenance badges (`Scrapy` vs. `Crawl4AI`).

### 🕷️ 3. Dynamic Dual-Engine Web Crawler (`crawler.py`)
- **Scrapy Engine**: High-throughput static HTML/DOM parsing (~240 req/s) for rapid anchor link and resource discovery.
- **Crawl4AI Engine**: Headless Chromium browser automation evaluating dynamic single-page applications (SPAs), multi-step authentication workflows (e.g. dropping MFA challenge steps), client-side routing, and complex JavaScript state machines.
- **Telemetry & Risk Distribution**: Live engine telemetry and vulnerability risk metrics served via `/api/crawler/telemetry`.

### 🛡️ 4. AppSec Patch Synthesizer (`PatchModal`)
- Automated remediation patch generation across 4 major frameworks:
  - **Node.js / Express**
  - **Python / FastAPI**
  - **Java / Spring Boot**
  - **TypeScript / Next.js**
- Enforces valid Unified Git Diffs (`--- a/...` and `+++ b/...`), architectural justifications for bypass neutralization, and automated verification unit test snippets.

### 📜 5. Architect's Threat Journal (`ThreatJournal`)
- Architectural threat modeling tool allowing engineers to evaluate proposed designs, webhook ingestion pipelines, and auth flows before writing code.
- **Prompt Injection Firebreak**: Ingress payloads pass through `promptInjectionFirebreakMiddleware` and `sanitizeJournalInput` to neutralize adversarial prompt injections and DAN jailbreaks.
- **Ephemeral Redaction (Data Minimization)**: Automatically scrubs emails (`{{REDACTED_EMAIL_n}}`), bearer tokens/API keys (`{{REDACTED_BEARER_n}}`), and IP addresses (`{{REDACTED_IP_n}}`) before sending prompts to LLMs, restoring placeholders in the response.
- STRIDE threat categorization, OWASP Top 10 mapping, and real-time Firestore persistence.

### 🎨 6. Visual Test Flow Architect & Flow AI Conversational Attack Planner (`VisualTestBuilder`, `FlowAIChatDrawer` & `FlowAuditModal`)
- Interactive ReactFlow canvas to model multi-stage application workflows and security boundaries.
- Custom node types: `UserInput`, `AuthGate`, `APICall`, `DatabaseQuery`, `CloudService`, `FuzzerNode`, and `ExploitNode`.
- **Text-to-Flow Generation**: Synthesize complete ReactFlow node/edge structures from natural language architectural descriptions (`POST /api/flows/generate-from-text`).
- **Conversational Attack Planner (`FlowAIChatDrawer`)**: Interactive chat interface powered by Sentinel-Prime to formulate 4-phase penetration test plans, generate attack flows, identify high-severity vulnerabilities (CVSS 8.8–9.4) with reproducible `curl` PoCs, and offer one-click patch synthesis (`POST /api/flows/chat-plan`).
- **Curated Dynamic Scenarios (`GET /api/flows/scenarios`)**: Preconfigured, high-risk attack templates including OAuth 2.0 Account Takeover, Cloud Metadata SSRF & IAM STS Dump, Cross-Tenant BOLA, JWT `alg:none` escalation, Unrestricted File Upload RCE, and Dynamic SQLi Schema Dump.
- **Flow-to-Audit Injection Engine**: Simulates adversarial payloads across connected nodes, evaluating latency, verdicts (`VULNERABLE` vs. `SECURE`), and overall flow risk (`POST /api/flows/audit`).

### ⚡ 7. Synthesized Exploit Chains (`SynthesizedExploitChainCard`)
- Self-evolution engine correlates multiple lower-severity vulnerabilities to discover high-impact compound attack vectors (e.g., combining an Open Redirect with an OAuth callback handler to achieve Account Takeover).
- Includes step-by-step Gemini reasoning traces, synthesized reproduction curl snippets, and unified mitigation advice.

### 🔍 8. Result Deviation Engine (`ResultDeviationEngine`)
- Compares expected baseline responses against actual live application responses across test runs.
- Detects subtle drift, unauthorized field exposure, HTTP status code deviations, and latency anomalies with interactive visual heatmaps.

### 📊 9. Reports & Findings Export
- Comprehensive audit reports with executive summaries, technical findings, reproduction PoCs, and exclusion logs.
- Professional PDF report generation using `jsPDF` + `jspdf-autotable`, and raw JSON export.

### 📚 10. Knowledge Base & Comprehensive FAQ (`KnowledgeBase`)
- Dedicated documentation hub with in-depth guides covering platform architecture, agent rosters, crawling telemetry, visual modeling, threat journaling, patch synthesis, and zero-trust security.
- Interactive, searchable Frequently Asked Questions (FAQ) section addressing common operational queries, architecture decisions, and troubleshooting steps.

### 🔒 11. Zero-Trust Security & Multi-Tenancy Architecture
- **Zero Secrets in Client Code**: Master keys (`GEMINI_API_KEY`) reside exclusively server-side and resolve dynamically from Google Cloud Secret Manager or runtime container environments.
- **Granular Firestore Rules**: User data is strictly partitioned under `/users/{userId}/entries` and alerts under `/users/{userId}/alerts`.
- **Interactive Multi-Tenancy Suite (`MultiTenancyCheckModal`)**: 6-step automated test suite verifying unauthenticated rejection, token forgery rejection, tenant isolation, cross-tenant block, prompt injection guard, and client bundle zero-secret audit.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript 5.8, Tailwind CSS v4, Motion (`motion/react` 12), Lucide React |
| **Data Visualization** | ReactFlow 11, Recharts 3, D3 7 |
| **Reporting & Export** | jsPDF, jspdf-autotable, React Markdown |
| **Backend API Server** | Node.js, Express 4.21, TypeScript (`tsx` 4.21), Vite 6.2 Middleware |
| **AI / LLM Engine** | Google GenAI SDK (`@google/genai`), Gemini 3.8 Flash & Gemini 3.1 Pro |
| **Agent Tool Calling** | MCP Function Calling (`server/agentTools.ts`, `server/mcpOrchestrator.ts`) |
| **Database & Cloud** | Google Cloud Firestore, Firebase Auth, Google Cloud Secret Manager |
| **Web Crawling** | Python 3, Scrapy, Crawl4AI |

---

## 4. Directory Structure

```
├── .ai-ignore                          # AI tooling ignore rules
├── .env.example                        # Environment variable documentation
├── .gemini/
│   └── config                          # Gemini tooling configuration
├── .prompt                             # Agent persona and directives
├── AGENTS.md                           # System architecture & coordination protocol
├── agent.md                            # Complete agent reference manual
├── crawler.py                          # Dual-engine crawler script (Scrapy & Crawl4AI)
├── firebase-applet-config.json         # Firebase client public identifiers
├── firebase-blueprint.json             # Database schema & entity definitions
├── firestore.rules                     # Firestore database security rules
├── index.html                          # HTML entry point
├── metadata.json                       # Applet metadata and capabilities
├── package.json                        # Node dependencies and build scripts
├── README.md                           # Master project documentation
├── server.ts                           # Express backend server with Vite middleware & security APIs
├── server/
│   ├── agentTools.ts                   # MCP agent tool declarations & executors
│   ├── flowSyncEngine.ts               # Text-to-flow & visual flow audit engine
│   ├── mcpOrchestrator.ts              # Autonomous MCP agent audit orchestrator
│   └── patchSynthesizer.ts             # AppSec Git diff patch synthesizer
├── src/
│   ├── App.tsx                         # Main application dashboard and navigation orchestrator
│   ├── components/
│   │   ├── AboutPage.tsx               # Platform vision & architect profile
│   │   ├── FlowAIChatDrawer.tsx        # Conversational attack flow planner & high-risk scenario finder
│   │   ├── FlowAuditModal.tsx          # Adversarial visual flow injection audit modal
│   │   ├── KnowledgeBase.tsx           # Documentation guides & interactive FAQ
│   │   ├── McpTraceTerminal.tsx        # Live MCP tool execution trace terminal
│   │   ├── MultiTenancyCheckModal.tsx  # 6-step zero-trust verification test suite
│   │   ├── PatchModal.tsx              # Multi-framework unified Git diff patch modal
│   │   ├── PersonalJournal.tsx         # Personal reflection companion with AI Studio instructions
│   │   ├── ResultDeviationEngine.tsx   # Expected vs. actual drift comparator
│   │   ├── SitemapAttackSurfaceGraph.tsx # D3-powered force-directed sitemap graph
│   │   ├── SynthesizedExploitChainCard.tsx# Compound exploit chain visualizer
│   │   ├── ThreatJournal.tsx           # Architect's threat modeling journal
│   │   └── VisualTestBuilder.tsx       # ReactFlow visual security workflow builder
│   ├── firebase.ts                     # Firebase client SDK initialization & auth helpers
│   ├── index.css                       # Tailwind CSS v4 styling rules
│   ├── lib/
│   │   ├── firestoreUtils.ts           # Standardized Firestore error handling
│   │   └── utils.ts                    # Class merging utility (clsx + tailwind-merge)
│   ├── main.tsx                        # React application entry point
│   ├── services/
│   │   └── agentService.ts             # Client-side agent service, types & API helpers
│   └── testCases.ts                    # OWASP Top 10 test case definitions and payloads
├── tsconfig.json                       # TypeScript compiler configuration
└── vite.config.ts                      # Vite build and plugin configuration
```

---

## 5. API Reference

The Express server (`server.ts`) exposes the following endpoints on port `3000`:

### Core & Health
- `GET /api/health`: Returns server status and operating mode (`development` / `production`).

### Autonomous MCP Agent Auditing & Tool Calling
- `POST /api/agents/mcp-audit`: Runs an autonomous multi-agent audit using `@google/genai` tool calling with `gemini-3.8-flash`.
- `POST /api/agents/tools/crawl`: Executes Deep-Crawler endpoint traversal.
- `POST /api/agents/tools/idor-fuzz`: Probes target for IDOR / BOLA parameter tampering.
- `POST /api/agents/tools/jwt-tamper`: Evaluates JWT signature bypasses (`alg:none`) and role tampering.
- `POST /api/agents/tools/owasp-scan`: Automated OWASP Top 10 probe across selected vectors.
- `POST /api/agents/tools/verify-exploit`: Validates exploit reproducibility and outputs verified PoCs.
- `POST /api/agents/generate-patch`: Synthesizes unified Git diff patches across Express, FastAPI, Spring Boot, and Next.js.

### Dynamic Web Crawling
- `POST /api/crawler/run`: Executes crawler analysis against a target URL (Scrapy / Crawl4AI).
- `GET /api/crawler/telemetry`: Retrieves active crawler engine status, complex scenario findings, and risk distributions.

### Visual Flow Synthesis & Audit
- `POST /api/flows/generate-from-text`: Translates natural language descriptions into ReactFlow node/edge graphs.
- `POST /api/flows/chat-plan`: Conversational attack flow planner, dynamic ReactFlow synthesis & high-severity vulnerability finder.
- `GET /api/flows/scenarios`: Retrieves curated dynamic attack scenarios catalog (OAuth ATO, Cloud SSRF, BOLA, JWT, RCE, SQLi).
- `POST /api/flows/audit`: Executes step-by-step adversarial payload injection across visual flow nodes.

### Architect's Threat Journal
- `POST /api/security/threat-journal/analyze`: Analyzes design entries with Sentinel-Prime, applying Ephemeral Redaction and Prompt Injection Firebreaks.
- `GET /api/security/threat-journal`: Retrieves recent architectural threat journal entries.
- `DELETE /api/security/threat-journal/:id`: Deletes an architectural threat entry.

### Personal Gemini Journal (`PersonalJournal`)
- `POST /api/journal/reflect`: Generates engineering & personal reflection insights using AI Studio custom instructions, prompt injection firebreak, and Ephemeral Redaction data minimization.
- `GET /api/journal/entries`: Retrieves user's isolated journal entries (`/users/{uid}/entries`).
- `DELETE /api/journal/entries/:id`: Deletes a user journal entry from their isolated partition.

### Agent Coordination, Tasks & Alerts
- `POST /api/agents/register`: Registers or heartbeats an agent in Firestore.
- `PATCH /api/tasks/:taskId`: Updates step execution status, step results, or task completion.
- `GET /api/tools/tasks`: Fetches all audit tasks from Firestore.
- `POST /api/tools/tasks`: Creates a new audit task document in Firestore.
- `GET /api/alerts`: Retrieves real-time threat detection alerts feed.
- `POST /api/alerts`: Triggers a new threat alert.
- `GET /api/users/:uid/alerts`: Retrieves tenant-partitioned threat alerts.

### Zero-Trust & Multi-Tenancy Validation
- `GET /api/security/constitution`: Returns the non-negotiable security directives and cloud architecture specs.
- `GET /api/security/secret-manager-proof`: Verifies zero secret leakage into client bundles and validates Secret Manager key provenance.
- `POST /api/security/test-multitenancy`: Executes an automated 6-point test suite verifying unauthenticated rejection, token forgery rejection, tenant isolation, cross-tenant block, prompt injection guard, and client bundle zero-secret audit.
- `POST /api/security/test-prompt-firebreak`: Validates that adversarial prompt injection payloads are blocked.

---

## 6. Environment & Configuration

Environment variables are declared in `.env.example`:

```env
# Required for Gemini AI API calls (server-side only)
GEMINI_API_KEY=

# URL where the applet is hosted
APP_URL=

# Optional Google Cloud Project ID for Secret Manager runtime resolution
GCP_PROJECT_ID=
```

> ⚠️ **Security Directives**:
> - Never expose API keys or secrets in client-side code (`src/`).
> - Client-side public configurations reside in `firebase-applet-config.json`.
> - Server-side secrets are resolved via container environment variables or Google Cloud Secret Manager at runtime.

---

## 7. Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- Python 3.9+ (for dynamic crawling scripts)

### Installation
```bash
npm install
```

### Development
```bash
# Start backend Express server with Vite middleware on port 3000
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Type Checking & Linting
```bash
npm run lint
```

### Production Build
```bash
npm run build
```

---

## 8. License

This project is licensed under the Apache-2.0 License.
