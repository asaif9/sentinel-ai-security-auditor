import { GoogleGenAI } from "@google/genai";

export interface PatchRequest {
  finding: {
    id?: string;
    title: string;
    severity: string;
    description: string;
    impact?: string;
    remediation?: string;
    poc?: string;
    url?: string;
    asset?: string;
    request?: string;
    response?: string;
  };
  framework?: "express" | "nextjs" | "django" | "fastapi" | "spring";
}

export interface PatchResult {
  patchDiff: string;
  framework: string;
  fileName: string;
  whyItPreventsBypasses: string;
  bypassesNeutralized: string[];
  verificationSnippet?: string;
  generatedBy: string;
}

export async function generateAppSecPatch(
  req: PatchRequest,
  apiKey?: string | null
): Promise<PatchResult> {
  const { finding, framework = "express" } = req;
  const title = finding.title || "Security Vulnerability";
  const desc = finding.description || "";
  const lowerTitle = title.toLowerCase() + " " + desc.toLowerCase();

  // Try Gemini generation if API key is provided
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const prompt = `You are AppSec-Engineer, a Principal Application Security Engineer at Sentinel AI.
Generate a professional, production-ready unified Git diff / PR patch that directly remediates this vulnerability:
Title: ${title}
Severity: ${finding.severity}
Description: ${desc}
Remediation Note: ${finding.remediation || "Standard OWASP defense"}
Target Framework: ${framework.toUpperCase()}

CRITICAL REQUIREMENTS:
1. Provide a standard, valid unified Git diff (starting with '--- a/...' and '+++ b/...').
2. Explain precisely WHY the patch prevents bypasses (e.g. why regex boundaries prevent subdomain spoofing, why timing-safe equality prevents timing attacks, why parameterized queries eliminate SQL syntax breaks).
3. List 3-4 specific bypass techniques that are now neutralized.
4. Provide a quick automated unit test / verification code snippet.

Return ONLY valid JSON with this exact schema:
{
  "patchDiff": "--- a/path/to/file.ts\\n+++ b/path/to/file.ts\\n@@ -10,6 +10,18 @@\\n...",
  "framework": "${framework}",
  "fileName": "src/middleware/redirectGuard.ts",
  "whyItPreventsBypasses": "Detailed architectural explanation of bypass prevention...",
  "bypassesNeutralized": ["Subdomain Spoofing (e.g. trusted.com.attacker.com)", "URL Scheme Injection (e.g. javascript:)", "Backslash Delimiter Bypass (e.g. /\\\\attacker.com)"],
  "verificationSnippet": "// Jest / Supertest code verifying patch..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.patchDiff && parsed.whyItPreventsBypasses) {
          return {
            ...parsed,
            generatedBy: "AppSec-Engineer (Gemini AI Autonomous Synthesizer)"
          };
        }
      }
    } catch (e) {
      console.warn("Gemini patch synthesis fallback triggered:", e);
    }
  }

  // High-craft, deterministic production-grade fallbacks tailored by category and framework
  return getDeterministicPatch(finding, framework);
}

function getDeterministicPatch(finding: any, framework: string): PatchResult {
  const title = (finding.title || "").toLowerCase();
  const desc = (finding.description || "").toLowerCase();
  const combo = `${title} ${desc}`;

  if (combo.includes("redirect")) {
    if (framework === "django") {
      return {
        fileName: "core/views.py",
        framework: "django",
        generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
        patchDiff: `--- a/core/views.py
+++ b/core/views.py
@@ -1,6 +1,8 @@
 from django.shortcuts import redirect
+from django.utils.http import url_has_allowed_host_and_scheme
+from django.conf import settings
 
 def navigate_handler(request):
     target = request.GET.get('target', '/')
-    return redirect(target)
+    # Strictly validate against allowed hosts and require safe HTTPS scheme
+    is_safe = url_has_allowed_host_and_scheme(
+        url=target,
+        allowed_hosts=settings.ALLOWED_REDIRECT_HOSTS,
+        require_https=True
+    )
+    if not is_safe:
+        return redirect('/')
+    return redirect(target)`,
        whyItPreventsBypasses: "Uses Django's native url_has_allowed_host_and_scheme() which decodes percent-encoded bytes and strips leading backslashes (preventing /\\attacker.com and //attacker.com protocol-relative bypasses) while validating hostnames strictly against the ALLOWED_REDIRECT_HOSTS whitelist.",
        bypassesNeutralized: [
          "Protocol-Relative Redirection (//evil.corp)",
          "Backslash Scheme Delimiters (/\\evil.corp)",
          "Subdomain Spoofing (company.com.attacker.com)",
          "JavaScript URI Scheme (javascript:alert(1))"
        ],
        verificationSnippet: `def test_open_redirect_neutralized(client):
    res = client.get('/navigate?target=//evil.corp')
    assert res.url == '/'  # Safely fell back to root`
      };
    } else if (framework === "nextjs") {
      return {
        fileName: "app/api/redirect/route.ts",
        framework: "nextjs",
        generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
        patchDiff: `--- a/app/api/redirect/route.ts
+++ b/app/api/redirect/route.ts
@@ -1,7 +1,24 @@
 import { NextRequest, NextResponse } from 'next/server';
 
+const ALLOWED_HOSTS = new Set(['app.sentinel.internal', 'sentinel.example.com']);
+
 export async function GET(req: NextRequest) {
   const target = req.nextUrl.searchParams.get('target') || '/';
-  return NextResponse.redirect(new URL(target, req.url));
+  
+  // Normalize target and prevent protocol-relative '//' attacks
+  if (target.startsWith('//') || target.startsWith('/\\\\')) {
+    return NextResponse.redirect(new URL('/', req.url));
+  }
+  
+  try {
+    const parsed = new URL(target, req.url);
+    // Allow relative paths on the same origin or explicit whitelisted domains
+    if (parsed.origin !== req.nextUrl.origin && !ALLOWED_HOSTS.has(parsed.hostname)) {
+      return NextResponse.redirect(new URL('/', req.url));
+    }
+    return NextResponse.redirect(parsed);
+  } catch {
+    return NextResponse.redirect(new URL('/', req.url));
+  }
 }`,
        whyItPreventsBypasses: "Parses target using strict WHATWG URL specification, checks parsed.origin against the request origin, blocks protocol-relative prefixes ('//' and '/\\'), and matches foreign hostnames against an immutable Set whitelist.",
        bypassesNeutralized: [
          "Double URL-Encoding (%252f%252fevil.com)",
          "Authority Confusion (https://target.com@evil.com)",
          "Protocol Relative Redirection (//evil.com)",
          "Whitespace / CRLF Header Injection"
        ],
        verificationSnippet: `it('blocks protocol-relative redirect', async () => {
  const res = await GET(new NextRequest('http://localhost/api/redirect?target=//evil.com'));
  expect(res.headers.get('Location')).toBe('http://localhost/');
});`
      };
    } else {
      // Express default
      return {
        fileName: "src/routes/redirect.ts",
        framework: "express",
        generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
        patchDiff: `--- a/src/routes/redirect.ts
+++ b/src/routes/redirect.ts
@@ -1,9 +1,27 @@
 import express from 'express';
 const router = express.Router();
 
+const WHITELISTED_DOMAINS = ['sentinel.internal', 'trusted-partner.com'];
+
+function isSafeRedirect(rawTarget: string, reqHost: string): boolean {
+  if (!rawTarget || typeof rawTarget !== 'string') return false;
+  // Block protocol-relative and backslash obfuscations
+  if (/^[\\/]{2,}|^[\\/][\\\\]/.test(rawTarget)) return false;
+  // Allow relative URLs starting with a single '/'
+  if (rawTarget.startsWith('/') && !rawTarget.startsWith('//')) return true;
+  try {
+    const parsed = new URL(rawTarget);
+    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
+    return parsed.hostname === reqHost || WHITELISTED_DOMAINS.includes(parsed.hostname);
+  } catch {
+    return false;
+  }
+}
+
 router.get('/redirect', (req, res) => {
   const target = req.query.target as string;
-  res.redirect(target || '/');
+  const host = req.get('host') || 'localhost';
+  const safeDestination = isSafeRedirect(target, host) ? target : '/';
+  res.redirect(safeDestination);
 });
 
 export default router;`,
        whyItPreventsBypasses: "Regex anchoring forbids leading double slashes (//) and backslashes (/\\) that browsers parse as domain boundaries. The WHATWG URL parser enforces explicit HTTP/HTTPS protocols (blocking javascript: and data: URIs) and validates against host whitelist.",
        bypassesNeutralized: [
          "Protocol-Relative URLs (//evil.corp)",
          "Windows Directory Backslash Obfuscation (/\\evil.corp)",
          "URL Credential Abuse (https://user:pass@evil.corp)",
          "Dangerous URI Schemes (javascript:, vbscript:, data:)"
        ],
        verificationSnippet: `describe('Redirect Security', () => {
  it('neutralizes open redirect attempt', async () => {
    const res = await request(app).get('/redirect?target=https://evil.corp');
    expect(res.headers.location).toBe('/');
  });
});`
      };
    }
  }

  if (combo.includes("idor") || combo.includes("bola") || combo.includes("access control")) {
    return {
      fileName: "src/controllers/userController.ts",
      framework: framework,
      generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
      patchDiff: `--- a/src/controllers/userController.ts
+++ b/src/controllers/userController.ts
@@ -10,7 +10,13 @@
 export async function getUserProfile(req: AuthenticatedRequest, res: Response) {
   const { id } = req.params;
-  const user = await db.users.findById(id);
+  const authenticatedUserId = req.auth.uid;
+  const authenticatedTenantId = req.auth.tenantId;
+  
+  // Enforce zero-trust tenant and identity ownership
+  const user = await db.users.findOne({ _id: id, tenantId: authenticatedTenantId });
+  if (!user || (user.id !== authenticatedUserId && req.auth.role !== 'admin')) {
+    return res.status(403).json({ error: 'Access denied: Resource belongs to separate partition' });
+  }
   return res.json(user);
 }`,
      whyItPreventsBypasses: "Binds the database query scope directly to the cryptographically verified session tenant ID (`authenticatedTenantId`) and user ID (`req.auth.uid`), completely preventing cross-tenant and horizontal parameter tampering attacks regardless of user-supplied URL params.",
      bypassesNeutralized: [
        "Horizontal Resource Enumeration (/users/101 vs /users/102)",
        "Cross-Tenant TenantId Injection via Request Body / Query",
        "Privilege Escalation via Parameter Tampering",
        "Mass Assignment Overrides"
      ],
      verificationSnippet: `it('blocks cross-tenant query with 403', async () => {
  const res = await request(app)
    .get('/api/users/foreign_102')
    .set('Authorization', 'Bearer token_tenant_a');
  expect(res.status).toBe(403);
});`
    };
  }

  if (combo.includes("jwt") || combo.includes("token") || combo.includes("auth")) {
    return {
      fileName: "src/middleware/authGuard.ts",
      framework: framework,
      generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
      patchDiff: `--- a/src/middleware/authGuard.ts
+++ b/src/middleware/authGuard.ts
@@ -5,8 +5,18 @@
 export function verifyJwtMiddleware(req: Request, res: Response, next: NextFunction) {
   const token = req.headers.authorization?.split(' ')[1];
-  const decoded = jwt.decode(token);
-  req.user = decoded;
+  if (!token) return res.status(401).json({ error: 'Authorization token required' });
+  
+  try {
+    // Strictly disallow 'none' algorithm and enforce expected cryptographic algorithm
+    const verified = jwt.verify(token, process.env.JWT_SECRET!, {
+      algorithms: ['HS256', 'RS256'],
+      maxAge: '2h'
+    });
+    req.user = verified;
+    next();
+  } catch (err) {
+    return res.status(401).json({ error: 'Invalid, tampered, or expired signature' });
+  }
 }`,
      whyItPreventsBypasses: "Replaces unverified decoding (`jwt.decode`) with strict cryptographic verification (`jwt.verify`). Explicitly restricts allowed algorithms to ['HS256', 'RS256'], preventing algorithm confusion ('none' alg attacks and public-key-as-HMAC-secret attacks).",
      bypassesNeutralized: [
        "Algorithm 'none' Signature Bypass",
        "Public Key HMAC Confusion Attack",
        "Expired Token Replay",
        "Claim Modification / Role Tampering"
      ],
      verificationSnippet: `it('rejects alg:none unsigned token with 401', async () => {
  const forgedToken = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.';
  const res = await request(app).get('/api/admin').set('Authorization', \`Bearer \${forgedToken}\`);
  expect(res.status).toBe(401);
});`
    };
  }

  // Default General Secure Patch
  return {
    fileName: "src/security/sanitizer.ts",
    framework: framework,
    generatedBy: "AppSec-Engineer (Deterministic AppSec Engine)",
    patchDiff: `--- a/src/security/sanitizer.ts
+++ b/src/security/sanitizer.ts
@@ -1,5 +1,15 @@
+import DOMPurify from 'isomorphic-dompurify';
+
 export function handleUserInput(input: string): string {
-  return input;
+  if (!input || typeof input !== 'string') return '';
+  // Sanitize input against script injection, event handlers, and data URIs
+  return DOMPurify.sanitize(input.trim(), {
+    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
+    ALLOWED_ATTR: ['href'],
+    ALLOW_DATA_ATTR: false
+  });
 }`,
    whyItPreventsBypasses: "Performs strict context-aware sanitization utilizing DOMPurify. Disallows script elements, inline event listeners (onerror, onload, onclick), and data: URIs, preventing DOM-based and reflected cross-site scripting.",
    bypassesNeutralized: [
      "SVG / Image Event Handler XSS (<svg/onload=alert(1)>)",
      "JavaScript Pseudo-Protocol URIs",
      "Nested Tag Filter Evasions",
      "Mutation XSS (mXSS)"
    ],
    verificationSnippet: `it('purges dangerous script tags', () => {
  const sanitized = handleUserInput('<script>alert(1)</script>Safe Text');
  expect(sanitized).toBe('Safe Text');
});`
  };
}
