import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  Zap, 
  Shield, 
  ChevronRight, 
  ChevronDown,
  ExternalLink, 
  Terminal,
  Cpu,
  Bot,
  Target,
  Info,
  HelpCircle,
  Code2,
  Bug,
  GitBranch,
  Lock,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Sliders,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Article {
  id: string;
  title: string;
  duration: string;
  category: string;
  summary: string;
  tags: string[];
  content: {
    overview: string;
    sections: {
      heading: string;
      body: string;
      code?: string;
      bullets?: string[];
      tip?: string;
    }[];
  };
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Agents & MCP' | 'Crawling' | 'Flow Architect' | 'Security & Zero-Trust' | 'Remediation & Patching';
  tags: string[];
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'General',
    question: 'What is Sentinel AI Security Auditor and how does it work?',
    answer: 'Sentinel AI is a zero-trust autonomous Application Security (AppSec) auditing suite. It combines a 10-agent hierarchical AI mesh led by Sentinel-Prime, dual-engine web crawlers (Scrapy and Crawl4AI), Model Context Protocol (MCP) function calling, a drag-and-drop Visual Flow Architect, a continuous Result Deviation Engine, and an automated AppSec Patch Synthesizer. It discovers vulnerabilities, tests for exploitability with zero false positives, correlates findings into compound attack chains, and produces production-ready unified Git diff patches.',
    tags: ['Overview', 'Architecture', 'AppSec']
  },
  {
    id: 'faq-2',
    category: 'Security & Zero-Trust',
    question: 'Where are API keys (e.g. GEMINI_API_KEY) stored and is client-side leakage possible?',
    answer: 'All sensitive credentials (including GEMINI_API_KEY and Firebase service accounts) reside strictly server-side. The backend resolves keys dynamically from Google Cloud Secret Manager or isolated container environment variables. The client application receives only public configuration identifiers (project ID, app ID) in firebase-applet-config.json. The /api/security/secret-manager-proof and /api/security/test-multitenancy endpoints continuously verify that exactly 0 sensitive secrets exist in browser bundles.',
    tags: ['Zero-Trust', 'Secret Manager', 'API Key']
  },
  {
    id: 'faq-3',
    category: 'Agents & MCP',
    question: 'How do sub-agents communicate and execute tools via MCP?',
    answer: 'Agents communicate through a structured message bus persisted in the /messages Firestore collection. When an audit begins, Sentinel-Prime invokes the Gemini model with structured tool declarations defined in server/agentTools.ts (trigger_crawl, run_idor_fuzz, simulate_jwt_tamper, run_owasp_scan, verify_vulnerability_exploit). When Gemini requests a tool invocation, server/mcpOrchestrator.ts routes the call to the specialized sub-agent, captures execution outputs, records a ToolExecutionTrace in Firestore, and streams live telemetry to the McpTraceTerminal component.',
    tags: ['MCP', 'Sub-Agents', 'Tool Calling', 'Traces']
  },
  {
    id: 'faq-4',
    category: 'Agents & MCP',
    question: 'What is the Self-Evolution Loop and how does compound exploit chaining work?',
    answer: 'During Phase 4 of an audit, Sentinel-Prime analyzes individual vulnerability findings to discover multi-stage compound exploit chains. For example, if Ghost-Scan identifies an Unvalidated Open Redirect on /oauth/callback and API-Guardian finds a permissive OAuth redirect_uri handler, Sentinel-Prime correlates these into a Critical Account Takeover chain. Evolved findings are tagged with isEvolved: true and rendered in the SynthesizedExploitChainCard with step-by-step reasoning steps and reproduction PoCs.',
    tags: ['Self-Evolution', 'Compound Exploits', 'Chaining']
  },
  {
    id: 'faq-5',
    category: 'Crawling',
    question: 'What is the difference between Scrapy and Crawl4AI in the crawler engine?',
    answer: 'Scrapy is an asynchronous, high-throughput static DOM crawler (~240 requests/sec) optimized for rapid HTML anchor link discovery, sitemap construction, and standard server-rendered endpoints. Crawl4AI is a headless Chromium browser automation engine designed for modern dynamic JavaScript single-page applications (SPAs), multi-step authentication state machines (e.g. dropping MFA challenge steps), client-side routing, and interactive forms. In "auto" mode, the engine selects Crawl4AI whenever authorization, MFA, or business logic test cases are selected.',
    tags: ['Crawler', 'Scrapy', 'Crawl4AI', 'Headless']
  },
  {
    id: 'faq-6',
    category: 'Security & Zero-Trust',
    question: 'What is the Prompt Injection Firebreak and Ephemeral Redaction in the Threat Journal?',
    answer: 'The Architect\'s Threat Journal enforces two critical zero-trust layers: (1) Prompt Injection Firebreak (promptInjectionFirebreakMiddleware & sanitizeJournalInput): screens all incoming text against adversarial jailbreaks, DAN mode vectors, and system prompt override attempts, instantly neutralizing them and logging security alerts to /users/{uid}/alerts. (2) Ephemeral Redaction: automatically scrubs emails ({{REDACTED_EMAIL_n}}), bearer tokens/JWTs ({{REDACTED_BEARER_n}}), and IP addresses ({{REDACTED_IP_n}}) before dispatching text to AI models, and transparently restores them upon response receipt for zero-trust data minimization.',
    tags: ['Threat Journal', 'Prompt Injection', 'Ephemeral Redaction', 'Privacy']
  },
  {
    id: 'faq-7',
    category: 'Flow Architect',
    question: 'How does the Visual Test Flow Architect work with Text-to-Flow and Flow-to-Audit?',
    answer: 'The Test Flow Architect is built on ReactFlow with 6 custom node types (UserInput, AuthGate, APICall, DatabaseQuery, CloudService, FuzzerNode). Users can visually draw multi-step security architectures or generate them from natural language using the Text-to-Flow engine (/api/flows/generate-from-text). Clicking "Audit Flow" launches the Flow-to-Audit engine (/api/flows/audit), which traverses connected nodes sequentially, injects simulated adversarial payloads (e.g., SQL syntax breaks, expired JWTs, foreign tenant IDs), measures latency, and outputs node-level verdicts (VULNERABLE vs SECURE).',
    tags: ['Visual Flow', 'ReactFlow', 'Text-to-Flow', 'Flow Audit']
  },
  {
    id: 'faq-8',
    category: 'Remediation & Patching',
    question: 'How does AppSec-Engineer synthesize remediation patches and prevent bypasses?',
    answer: 'The AppSec-Engineer sub-agent generates production-ready Unified Git Diffs across four major web frameworks: Node.js/Express, Python/FastAPI, Java/Spring Boot, and TypeScript/Next.js. Every synthesized patch includes: (1) valid Git diff syntax (--- a/... and +++ b/...), (2) architectural justification of why the fix neutralizes bypasses (e.g. constant-time comparisons, regex boundary anchors), (3) list of specific bypass techniques prevented, and (4) automated unit verification test snippets.',
    tags: ['Patching', 'Git Diff', 'AppSec-Engineer', 'Remediation']
  },
  {
    id: 'faq-9',
    category: 'Security & Zero-Trust',
    question: 'How is multi-tenant isolation enforced in Firestore?',
    answer: 'Firestore security rules (firestore.rules) strictly enforce tenant data isolation. User entries and private alerts are structurally partitioned under /users/{userId}/entries and /users/{userId}/alerts. Write and read operations require cryptographic verification matching request.auth.uid == userId. Cross-tenant access is rejected with PERMISSION_DENIED (403), as proven in the 6-point automated Multi-Tenancy Check modal.',
    tags: ['Multi-Tenancy', 'Firestore Rules', 'ABAC', 'Isolation']
  },
  {
    id: 'faq-10',
    category: 'General',
    question: 'What is the Result Deviation Engine and when should I use it?',
    answer: 'The Result Deviation Engine compares expected baseline API responses against actual server output during audit runs. It highlights structural schema deviations, unexpected sensitive fields (e.g. password hashes or internal tenant IDs), HTTP status code mismatches (e.g., 200 OK when 403 Forbidden was expected), and response latency anomalies with an interactive visual diff heatmap.',
    tags: ['Deviation Engine', 'Drift Analysis', 'Regression']
  },
  {
    id: 'faq-11',
    category: 'Crawling',
    question: 'How does the D3.js Sitemap Attack Surface Graph visualize discovered endpoints?',
    answer: 'The Sitemap Attack Surface Graph (SitemapAttackSurfaceGraph) uses a force-directed D3.js physics layout to map relationships between discovered endpoints, query parameters, and risk levels. Nodes are color-coded by severity (Critical, High, Medium, Low, Clean), sized by impact, and tagged with crawler engine provenance badges (Scrapy vs Crawl4AI). Clicking any node opens a parameter inspection drawer with risk scoring and direct fuzzing triggers.',
    tags: ['Attack Surface', 'D3.js', 'Graph', 'Visualization']
  },
  {
    id: 'faq-12',
    category: 'General',
    question: 'Can I export audit findings and executive summaries to PDF or JSON?',
    answer: 'Yes. In the Executive Summary and Audit Reports tabs, engineers can export comprehensive audit reports in two formats: (1) Professional PDF reports generated client-side using jsPDF and jspdf-autotable, formatted with executive risk summaries, CVSS score tables, reproduction curl commands, and remediation diffs; and (2) Raw JSON export suitable for ingestion into Jira, Splunk, or SIEM tools.',
    tags: ['Export', 'PDF Report', 'JSON', 'Compliance']
  },
  {
    id: 'faq-13',
    category: 'Agents & MCP',
    question: 'How does Vuln-Hunter eliminate false positives and formulate reproduction PoCs?',
    answer: 'Vuln-Hunter executes the verify_vulnerability_exploit MCP tool. When candidate anomalies are surfaced by Ghost-Scan or Infiltrator-X, Vuln-Hunter issues targeted confirmation requests with active exploit payloads, verifies whether server responses indicate genuine exploitation (e.g., external redirect origin, foreign tenant record leakage, or SQL syntax disclosure), calculates calibrated CVSS v3.1 scores, and formulates reproducible curl commands.',
    tags: ['Vuln-Hunter', 'PoC', 'False Positives', 'Verification']
  },
  {
    id: 'faq-14',
    category: 'Agents & MCP',
    question: 'What role does QA-Expert play in regression testing and test automation?',
    answer: 'QA-Expert specializes in automated test generation and regression verification. It synthesizes Playwright test scripts from verified vulnerability findings, identifies test coverage gaps across critical authentication flows, and ensures that once a remediation patch is deployed, the regression suite continuously verifies that the exploit remains neutralized across future releases.',
    tags: ['QA-Expert', 'Playwright', 'Automation', 'Regression']
  },
  {
    id: 'faq-15',
    category: 'General',
    question: 'How can external CI/CD pipelines or developers integrate with the Sentinel AI REST API?',
    answer: 'The Express server exposes standard RESTful endpoints on port 3000: POST /api/agents/mcp-audit initiates autonomous multi-agent audits; POST /api/crawler/run triggers dynamic crawling; POST /api/flows/audit runs visual workflow audits; and POST /api/agents/generate-patch synthesizes unified Git diff patches. All responses adhere to standard JSON response envelopes.',
    tags: ['API', 'CI/CD', 'Integration', 'REST']
  },
  {
    id: 'faq-16',
    category: 'Security & Zero-Trust',
    question: 'What happens if an adversarial prompt injection attack is sent to the Threat Journal?',
    answer: 'All ingress payloads to the Threat Journal and Flow Architect pass through promptInjectionFirebreakMiddleware and sanitizeJournalInput before reaching model reasoning. If an adversarial pattern (such as "ignore previous instructions", "DAN mode", or system prompt overrides) is detected, the server immediately halts processing, rejects the request with HTTP 400, and dispatches a security alert to /users/{uid}/alerts for audit tracking.',
    tags: ['Prompt Injection', 'Firebreak', 'Jailbreak', 'Guardrails']
  }
];

const KB_ARTICLES: Article[] = [
  {
    id: 'intro',
    category: 'Getting Started',
    title: 'Platform Architecture & Operating Principles',
    duration: '6 min read',
    tags: ['Architecture', 'Zero-Trust', 'Overview'],
    summary: 'A comprehensive architectural overview of Sentinel AI Security Auditor, explaining the hierarchical multi-agent mesh, zero-trust infrastructure, and scanning lifecycle.',
    content: {
      overview: 'Sentinel AI Security Auditor is an autonomous multi-agent security platform built from the ground up on zero-trust principles. Rather than relying on single-model heuristic guessing or noisy legacy web scanners, Sentinel AI deploys a coordinated mesh of specialized AI agents, dynamic dual-engine crawlers, and server-side verification sandboxes to achieve high-precision AppSec audits with verified proof-of-concept exploits.',
      sections: [
        {
          heading: '1. The Three-Tier System Architecture',
          body: 'The platform operates across three coordinated tiers:',
          bullets: [
            'Interface & Visualization Layer (Client): React 19 SPA running Tailwind CSS v4, Lucide icons, Motion layout transitions, D3-powered force-directed sitemap graphs, and ReactFlow workflow canvases.',
            'Secure API Gateway & Orchestrator (Server): Express 4 backend on port 3000 handling dynamic crawling, Gemini model invocation with MCP function calling, prompt firebreak filtering, and patch synthesis.',
            'Persistence & Rule Enforcement (Cloud): Google Cloud Firestore for structured task tracking, inter-agent messaging, vulnerability storage, and strict attribute-based security rules enforcing tenant isolation.'
          ]
        },
        {
          heading: '2. The Zero-Trust Security Paradigm',
          body: 'Sentinel AI enforces four non-negotiable security directives: Zero Secrets in Client Bundles (API keys resolve exclusively server-side), Cryptographic Multi-Tenant Isolation (all private resources partitioned by user ID), Defensive Ingress Guardrails (prompt injection firebreaks and payload sanitization), and Deterministic Error Handling (standardized error envelopes without leaking stack traces or database schemas).'
        },
        {
          heading: '3. End-to-End Audit Lifecycle',
          body: 'An audit progresses through five deterministic phases: Phase 1 Strategic Triage (Sentinel-Prime formulates assessment scope), Phase 2 Task Decomposition (sub-agent tasks registered in Firestore), Phase 3 Autonomous Crawling & Tool Calling (Scrapy/Crawl4AI endpoint discovery and specialized fuzzing), Phase 4 Self-Evolution Loop (correlation of compound multi-stage exploit chains), and Phase 5 Consolidation & Remediation (executive report generation, unified Git diff patch synthesis, and real-time alert dispatch).'
        }
      ]
    }
  },
  {
    id: 'agents',
    category: 'Autonomous Agents',
    title: 'The 10-Agent Roster & MCP Coordination Protocol',
    duration: '8 min read',
    tags: ['Agents', 'MCP', 'Sentinel-Prime', 'Specializations'],
    summary: 'Detailed specifications, roles, tool capabilities, and orchestration patterns for the 10 specialized agents powering Sentinel AI.',
    content: {
      overview: 'The Sentinel AI multi-agent mesh employs a hierarchical command model where Sentinel-Prime directs nine domain-specialized sub-agents. Each sub-agent is equipped with targeted capabilities and executes granular MCP tools.',
      sections: [
        {
          heading: '1. Agent Roles & Domains',
          body: 'Each agent is dedicated to a distinct security domain:',
          bullets: [
            'Sentinel-Prime (Orchestrator): Central strategic coordinator managing task decomposition, model reasoning, self-evolution loops, threat journal reviews, and executive reporting.',
            'Infiltrator-X (Fuzzing Specialist): Probes endpoints for Insecure Direct Object References (IDOR), parameter tampering, and broken access control via run_idor_fuzz.',
            'Ghost-Scan (OWASP Top 10): Executes broad automated scans across SQLi, XSS, CSRF, Open Redirects, CORS, and Command Injection via run_owasp_scan.',
            'Vuln-Hunter (Verification Specialist): Validates candidate vulnerabilities, rules out false positives, confirms exploit reproducibility, and outputs curl PoCs via verify_vulnerability_exploit.',
            'QA-Expert (Automation Specialist): Synthesizes automated Playwright test scripts and identifies regression coverage gaps.',
            'AppSec-Engineer (Remediation Specialist): Performs source code review simulations and synthesizes unified Git diff patches across Express, FastAPI, Spring Boot, and Next.js.',
            'Cloud-Sentry (Cloud Security): Audits cloud metadata SSRF endpoints (169.254.169.254), misconfigured S3/GCS buckets, and IAM role escalation risks.',
            'API-Guardian (API Security): Validates REST/GraphQL API authorization, BOLA/BFLA, mass-assignment vulnerabilities, and JWT tampering via simulate_jwt_tamper.',
            'Crypto-Cracker (Cryptography): Inspects SSL/TLS ciphers, hashing weaknesses (MD5/SHA1), cookie security flags, and JWT algorithm none bypasses.',
            'Deep-Crawler (Discovery Specialist): Traverses web surfaces and forms using dual-engine crawling (Scrapy and Crawl4AI) via trigger_crawl.'
          ]
        },
        {
          heading: '2. Live Tool Execution Traces',
          body: 'Every sub-agent tool invocation produces a standardized ToolExecutionTrace containing tool name, arguments, raw execution result, concise summary, and execution status (success, warning, or exploited). These traces are recorded in Firestore and rendered live in the McpTraceTerminal.'
        }
      ]
    }
  },
  {
    id: 'crawling',
    category: 'Dynamic Crawling',
    title: 'Dual-Engine Crawling: Scrapy vs. Crawl4AI Telemetry',
    duration: '7 min read',
    tags: ['Crawling', 'Scrapy', 'Crawl4AI', 'Attack Surface'],
    summary: 'Deep dive into the dual-engine crawler architecture, comparing high-throughput static DOM scraping with headless Chromium SPA state machine exploration.',
    content: {
      overview: 'Modern attack surfaces span both traditional server-rendered endpoints and complex, client-rendered single-page applications. Sentinel AI integrates two specialized crawling engines in crawler.py and server.ts to achieve exhaustive endpoint discovery.',
      sections: [
        {
          heading: '1. Scrapy Engine: High-Throughput Static Link Traversal',
          body: 'The Scrapy engine delivers rapid parsing (~240 requests/sec) across HTML anchor tags, static asset links, legacy forms, and configuration files. It is the optimal engine for mapping broad surface directories, sitemaps, and public resource trees without headless browser overhead.'
        },
        {
          heading: '2. Crawl4AI Engine: Headless Chromium SPA Automation',
          body: 'Crawl4AI launches a headless Chromium browser capable of executing client-side JavaScript, navigating dynamic Single Page Applications (React, Vue, Angular), evaluating client-side router states, and analyzing multi-step state machines. Crucially, Crawl4AI can discover hidden API endpoints by inspecting DOM mutations and intercepting background network calls.'
        },
        {
          heading: '3. Complex Scenario Discovery',
          body: 'Crawl4AI excels at detecting advanced behavioral flaws:',
          bullets: [
            'Multi-Step MFA Bypass: Identifying state machine flaws where dropping the 2FA verification request elevates access.',
            'Client-Side Parameter Tampering: Uncovering hidden payment and discount parameters in multi-step checkouts.',
            'Nested BOLA/IDOR: Discovering administrative API paths revealed only after client-side state transitions.',
            'OAuth Callback Flow Flaws: Probing redirect_uri parameters for protocol-relative open redirection.'
          ]
        },
        {
          heading: '4. Sitemap Attack Surface Graph',
          body: 'All discovered endpoints are mapped onto the interactive D3-powered SitemapAttackSurfaceGraph. Each node displays path, HTTP method, risk score (0–100), severity badge, crawler provenance tag (Scrapy vs Crawl4AI), and parameter inspection drawers.'
        }
      ]
    }
  },
  {
    id: 'visual-builder',
    category: 'Test Flow Architect',
    title: 'Visual Workflow Modeling & Adversarial Flow Auditing',
    duration: '9 min read',
    tags: ['ReactFlow', 'Text-to-Flow', 'Flow Audit', 'Visual Builder'],
    summary: 'How to build, generate, and adversarially audit multi-stage application workflows using the Visual Test Flow Architect.',
    content: {
      overview: 'The Visual Test Flow Architect (VisualTestBuilder) provides a node-based ReactFlow canvas allowing security engineers and architects to model multi-stage data pipelines, authentication gates, and business logic workflows, then test them for security vulnerabilities.',
      sections: [
        {
          heading: '1. Custom Node Taxonomy',
          body: 'The canvas supports six distinct node types:',
          bullets: [
            'UserInput: Entry forms, login screens, search inputs, file upload portals.',
            'AuthGate: JWT validation middleware, OAuth 2.0 PKCE gates, session checkpoints, MFA challenges.',
            'APICall: Backend REST endpoints, GraphQL queries, webhook ingestion handlers, reverse proxies.',
            'DatabaseQuery: Relational SQL transactions, NoSQL lookups, Firestore subcollection operations.',
            'CloudService: Third-party integration nodes (Stripe billing, Twilio SMS, AWS S3 object storage).',
            'FuzzerNode: Dedicated adversarial payload injection nodes testing boundary protections.'
          ]
        },
        {
          heading: '2. Text-to-Flow AI Synthesis',
          body: 'Security engineers can generate complete ReactFlow architectures from plain English descriptions. The backend (/api/flows/generate-from-text) prompts Gemini to output structured nodes with coordinates and animated edges representing the described workflow.'
        },
        {
          heading: '3. Flow-to-Audit Adversarial Simulation',
          body: 'Clicking "Audit Flow" launches the FlowAuditModal and invokes /api/flows/audit. The engine iterates through the visual graph, injecting tailored attack payloads into each node (e.g. boolean-based SQL injection, expired JWTs, missing HMAC headers), measuring latency, and tagging vulnerable nodes with actionable remediation guidance.'
        }
      ]
    }
  },
  {
    id: 'threat-journal',
    category: 'Threat Modeling',
    title: 'Architect\'s Threat Journal: Guardrails & Ephemeral Redaction',
    duration: '8 min read',
    tags: ['Threat Journal', 'Prompt Firebreak', 'Ephemeral Redaction', 'STRIDE'],
    summary: 'How the Architect\'s Threat Journal enforces zero-trust data minimization, prompt injection firebreaks, and STRIDE architectural threat modeling.',
    content: {
      overview: 'The Architect\'s Threat Journal (ThreatJournal) provides engineers with a secure scratchpad to evaluate proposed architectures, webhook ingestion pipelines, and authentication flows before writing code. Every entry is audited by Sentinel-Prime with strict defensive guardrails.',
      sections: [
        {
          heading: '1. Prompt Injection Firebreak Middleware',
          body: 'All incoming journal entries and architectural prompts pass through promptInjectionFirebreakMiddleware and sanitizeJournalInput before reaching model execution. The firebreak inspects payloads for adversarial patterns (e.g. "ignore previous instructions", "dump secrets", DAN jailbreaks). When an injection is detected, the request is immediately blocked (HTTP 400) and an alert is recorded in /users/{uid}/alerts.'
        },
        {
          heading: '2. Ephemeral Redaction Engine',
          body: 'To prevent PII or sensitive tokens from reaching third-party LLMs, users can toggle Ephemeral Redaction. The engine automatically replaces emails with {{REDACTED_EMAIL_n}}, bearer tokens/API keys with {{REDACTED_BEARER_n}}, and IP addresses with {{REDACTED_IP_n}}. After Sentinel-Prime completes threat modeling, the placeholders are restored in the final response.'
        },
        {
          heading: '3. Threat Modeling Output & STRIDE Mapping',
          body: 'Sentinel-Prime categorizes identified threats across the STRIDE model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) and maps them to OWASP Top 10 references, providing concrete code mitigations (e.g., HMAC-SHA256 signature verification with crypto.timingSafeEqual).'
        }
      ]
    }
  },
  {
    id: 'patching',
    category: 'Remediation',
    title: 'AppSec Patch Synthesizer: Multi-Framework Git Diffs',
    duration: '7 min read',
    tags: ['Patching', 'Git Diff', 'AppSec-Engineer', 'FastAPI', 'Express', 'Spring Boot', 'Next.js'],
    summary: 'Understanding how AppSec-Engineer synthesizes production-ready, bypass-proof unified Git diffs across four major web frameworks.',
    content: {
      overview: 'Finding vulnerabilities is only half the battle. The AppSec Patch Synthesizer (PatchModal & server/patchSynthesizer.ts) bridges the gap between penetration testing and engineering remediation by generating ready-to-merge Unified Git Diffs.',
      sections: [
        {
          heading: '1. Supported Frameworks',
          body: 'Patches can be tailored for four major application stacks:',
          bullets: [
            'Node.js / Express: Middleware guards, helmet configuration, parameterized DB calls, timing-safe equality.',
            'Python / FastAPI: Pydantic input validators, Depends() authorization dependencies, regex path validators.',
            'Java / Spring Boot: Spring Security filter chains, @PreAuthorize annotations, prepared statements.',
            'TypeScript / Next.js: Server action guards, Route Handler validation with Zod, iron-session protection.'
          ]
        },
        {
          heading: '2. Bypass Neutralization Criteria',
          body: 'Every patch generated by AppSec-Engineer must satisfy rigorous architectural criteria: standard Unified Git Diff format (--- a/... and +++ b/...), mathematical or optical justification for why bypasses are neutralized, enumeration of specific bypass techniques prevented (e.g., protocol-relative URL bypasses, timing side-channels, subdomain spoofing), and an automated unit test snippet verifying the fix.'
        }
      ]
    }
  },
  {
    id: 'deviation-engine',
    category: 'Deviation & Drift',
    title: 'Result Deviation Engine: Behavioral Drift & Anomaly Analysis',
    duration: '6 min read',
    tags: ['Deviation Engine', 'Drift', 'Regression', 'Anomalies'],
    summary: 'How the Result Deviation Engine detects behavioral drift, unauthorized field disclosure, and regression anomalies between expected and actual test responses.',
    content: {
      overview: 'Applications frequently suffer subtle security regressions during rapid deployment cycles. The Result Deviation Engine (ResultDeviationEngine) compares baseline API contracts against live audit responses to catch behavioral drift before attackers do.',
      sections: [
        {
          heading: '1. Drift Categories Analyzed',
          body: 'The engine inspects four primary deviation dimensions:',
          bullets: [
            'Unauthorized Field Disclosure: Response payloads containing extra keys not in the baseline schema (e.g. password_hash, internal_role, tenant_id).',
            'HTTP Status Code Mismatches: Endpoints returning HTTP 200 OK when the baseline specification mandates HTTP 403 Forbidden or 401 Unauthorized.',
            'Response Time Anomalies: Sudden latency spikes or execution timing discrepancies that indicate blind injection vulnerabilities or algorithmic complexity DoS.',
            'Missing Security Headers: Responses lacking critical security headers present in baseline configurations (HSTS, Content-Security-Policy, X-Frame-Options).'
          ]
        },
        {
          heading: '2. Visual Deviation Heatmaps',
          body: 'The component provides interactive side-by-side JSON diffs with syntax highlighting, visual deviation heatmaps, and one-click filtering by anomaly severity.'
        }
      ]
    }
  },
  {
    id: 'zero-trust',
    category: 'Security & Verification',
    title: 'Zero-Trust Architecture & Multi-Tenancy Verification',
    duration: '8 min read',
    tags: ['Zero-Trust', 'Multi-Tenancy', 'Firestore Rules', 'Verification'],
    summary: 'A deep dive into the 6-step multi-tenancy verification suite, secret provenance, and Firestore security rule hardening.',
    content: {
      overview: 'Sentinel AI enforces a strict zero-trust operational model where every identity, query, and secret is continuously verified. The platform includes an automated 6-step verification suite (MultiTenancyCheckModal) that validates isolation in real time.',
      sections: [
        {
          heading: '1. The 6-Point Zero-Trust Test Suite',
          body: 'The test suite evaluates the following assertions against the running backend (/api/security/test-multitenancy):',
          bullets: [
            'Test 1 (Unauthenticated Rejection): Verifies that requests without Authorization Bearer tokens are rejected with HTTP 401.',
            'Test 2 (Forged Token Rejection): Verifies that cryptographically forged or malformed tokens fail verification before reaching model logic.',
            'Test 3 (Tenant Partition Isolation): Confirms that writes to /users/{current_uid}/entries succeed within the authorized partition.',
            'Test 4 (Cross-Tenant Block): Confirms that cross-tenant access to /users/{foreign_uid}/entries is strictly blocked with PERMISSION_DENIED (HTTP 403).',
            'Test 5 (Prompt Injection Guardrail): Validates that prompt injection attempts are neutralized by the firebreak middleware.',
            'Test 6 (Client Bundle Zero-Secret Proof): Confirms that exactly 0 secret keys exist in client browser bundles.'
          ]
        },
        {
          heading: '2. Secret Manager Provenance',
          body: 'The /api/security/secret-manager-proof endpoint confirms that the master GEMINI_API_KEY is resolved dynamically from Google Cloud Secret Manager or container environment variables, with zero exposure to client code.'
        }
      ]
    }
  }
];

export const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guides' | 'faq'>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string>('intro');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('All');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  const activeArticle = useMemo(() => {
    return KB_ARTICLES.find(a => a.id === activeArticleId) || KB_ARTICLES[0];
  }, [activeArticleId]);

  // Filtered Articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return KB_ARTICLES;
    const q = searchQuery.toLowerCase();
    return KB_ARTICLES.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Filtered FAQs based on category & search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchesCategory = faqCategoryFilter === 'All' || item.category === faqCategoryFilter;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.question.toLowerCase().includes(q) ||
             item.answer.toLowerCase().includes(q) ||
             item.tags.some(t => t.toLowerCase().includes(q));
    });
  }, [faqCategoryFilter, searchQuery]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(id);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const faqCategories = ['All', 'General', 'Agents & MCP', 'Crawling', 'Flow Architect', 'Security & Zero-Trust', 'Remediation & Patching'];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header & Hero */}
      <section className="glass rounded-3xl p-8 md:p-12 border border-border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-neon-cyan/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3 text-neon-cyan">
            <BookOpen size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Platform Documentation & Reference</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight mb-4 uppercase">
            Knowledge Base & FAQ
          </h1>
          <p className="text-text-muted text-sm sm:text-base mb-8 leading-relaxed">
            Comprehensive, fact-based documentation and frequently asked questions explaining every feature, agent role, crawling engine, zero-trust guardrail, and remediation workflow across Sentinel AI Security Auditor.
          </p>

          {/* Search Bar & Mode Switcher */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-neon-cyan transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Search across guides, FAQs, MCP tools, crawling, or nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border-subtle rounded-2xl py-3.5 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/50 transition-all"
              />
            </div>

            <div className="flex bg-surface border border-border-subtle rounded-2xl p-1 shrink-0">
              <button
                onClick={() => setActiveTab('guides')}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === 'guides' 
                    ? "bg-neon-cyan text-deep-space shadow-md" 
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <FileText size={15} />
                Architecture Guides ({KB_ARTICLES.length})
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                  activeTab === 'faq' 
                    ? "bg-neon-cyan text-deep-space shadow-md" 
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <HelpCircle size={15} />
                FAQ ({FAQ_ITEMS.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {activeTab === 'guides' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass rounded-3xl p-5 border border-border-subtle space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
                  Articles ({filteredArticles.length})
                </span>
                {searchQuery && (
                  <span className="text-[10px] text-neon-cyan font-semibold">
                    Filtering by "{searchQuery}"
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-surface">
                {filteredArticles.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">
                    No articles match your search query.
                  </div>
                ) : (
                  filteredArticles.map((article) => {
                    const isActive = activeArticleId === article.id;
                    return (
                      <button
                        key={article.id}
                        onClick={() => setActiveArticleId(article.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl transition-all border group relative",
                          isActive
                            ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan font-bold shadow-sm"
                            : "bg-surface hover:bg-surface-hover border-border-subtle text-text-muted hover:text-text-primary"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                            isActive ? "bg-neon-cyan/20 text-neon-cyan" : "bg-surface-hover text-text-muted"
                          )}>
                            {article.category}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {article.duration}
                          </span>
                        </div>
                        <h4 className={cn(
                          "text-xs font-bold leading-snug mb-1",
                          isActive ? "text-text-primary font-black" : "text-text-primary"
                        )}>
                          {article.title}
                        </h4>
                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Architecture Callout */}
            <div className="glass rounded-3xl p-6 border border-border-subtle space-y-3">
              <div className="flex items-center gap-2 text-neon-cyan">
                <Shield size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider">Zero-Trust Directives</h4>
              </div>
              <ul className="text-xs text-text-muted space-y-2 list-disc list-inside">
                <li><strong className="text-text-primary">Zero Secrets:</strong> Keys reside strictly server-side.</li>
                <li><strong className="text-text-primary">Auditable State:</strong> Traces stored in Firestore.</li>
                <li><strong className="text-text-primary">Self-Evolution:</strong> Automated exploit chaining.</li>
                <li><strong className="text-text-primary">Production Patches:</strong> Valid Unified Git diffs.</li>
              </ul>
            </div>
          </div>

          {/* Article Detail View */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.article
                key={activeArticle.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass rounded-3xl p-8 md:p-10 border border-border-subtle space-y-8"
              >
                {/* Article Header */}
                <div className="border-b border-border-subtle pb-6 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-neon-cyan/10 text-neon-cyan text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-neon-cyan/20">
                        {activeArticle.category}
                      </span>
                      <span className="text-xs text-text-muted">
                        • {activeArticle.duration}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                    {activeArticle.title}
                  </h2>

                  <p className="text-sm text-text-muted leading-relaxed">
                    {activeArticle.summary}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {activeArticle.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-semibold bg-surface px-2.5 py-0.5 rounded-full text-text-muted border border-border-subtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Article Content */}
                <div className="space-y-8 text-text-muted leading-relaxed text-sm">
                  {/* Overview paragraph */}
                  <div className="p-5 rounded-2xl bg-surface border border-border-subtle text-text-primary leading-relaxed">
                    {activeArticle.content.overview}
                  </div>

                  {/* Sections */}
                  {activeArticle.content.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />
                        {sec.heading}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-muted">
                        {sec.body}
                      </p>

                      {sec.bullets && (
                        <ul className="space-y-2 pl-4">
                          {sec.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-xs leading-relaxed text-text-muted list-disc">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {sec.code && (
                        <div className="relative mt-3 rounded-2xl bg-deep-space border border-border-subtle p-4 font-mono text-xs text-text-primary overflow-x-auto">
                          <button
                            onClick={() => handleCopyCode(sec.code!, `${activeArticle.id}-${idx}`)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-neon-cyan transition-colors"
                            title="Copy Code"
                          >
                            {copiedCodeIndex === `${activeArticle.id}-${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                          <pre>{sec.code}</pre>
                        </div>
                      )}

                      {sec.tip && (
                        <div className="p-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 flex gap-3 text-xs text-text-muted">
                          <Info size={16} className="text-neon-cyan shrink-0 mt-0.5" />
                          <div>{sec.tip}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* FAQ Tab View */
        <div className="space-y-8">
          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategoryFilter(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  faqCategoryFilter === cat
                    ? "bg-neon-cyan text-deep-space border-neon-cyan shadow-sm"
                    : "bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary border-border-subtle"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center border border-border-subtle text-text-muted">
                <HelpCircle size={32} className="mx-auto mb-3 text-text-muted opacity-50" />
                <h3 className="text-lg font-bold text-text-primary mb-1">No FAQs Found</h3>
                <p className="text-xs">No questions matched your search criteria. Try a different query or select "All".</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className={cn(
                      "glass rounded-2xl border transition-all overflow-hidden",
                      isExpanded ? "border-neon-cyan/30 bg-surface/80" : "border-border-subtle hover:border-border-subtle"
                    )}
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border-subtle text-neon-cyan">
                            {faq.category}
                          </span>
                          {faq.tags.map(tag => (
                            <span key={tag} className="hidden sm:inline-block text-[10px] text-text-muted">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-text-primary">
                          {faq.question}
                        </h3>
                      </div>
                      <div className={cn(
                        "p-2 rounded-xl transition-transform duration-200 text-text-muted",
                        isExpanded ? "rotate-180 text-neon-cyan bg-neon-cyan/10" : "bg-surface"
                      )}>
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border-subtle">
                            <p>{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
