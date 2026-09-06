import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";

export interface Agent {
  id: string;
  name: string;
  role: 'primary' | 'sub-agent';
  specialization: string;
  status: 'idle' | 'active' | 'offline';
}

export interface TaskStep {
  step: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: string;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAgentId?: string;
  steps: TaskStep[];
  createdAt?: any;
  updatedAt?: any;
  toolTraces?: any[];
}

export interface ToolExecutionTrace {
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

export interface PatchResult {
  patchDiff: string;
  framework: string;
  fileName: string;
  whyItPreventsBypasses: string;
  bypassesNeutralized: string[];
  verificationSnippet?: string;
  generatedBy: string;
}

// --- Client Helper Functions ---

export async function fetchAppSecPatch(finding: any, framework: string = "express"): Promise<PatchResult> {
  const res = await fetch("/api/agents/generate-patch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ finding, framework })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Patch synthesis failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchFlowFromText(description: string): Promise<{ nodes: any[]; edges: any[]; summary: string }> {
  const res = await fetch("/api/flows/generate-from-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Flow generation failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchAuditFlow(nodes: any[], edges: any[], targetUrl?: string): Promise<any> {
  const res = await fetch("/api/flows/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes, edges, targetUrl })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Flow audit failed with status ${res.status}`);
  }
  return res.json();
}

export interface AttackChatPlanRequest {
  prompt: string;
  scenario?: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  testAttack?: boolean;
}

export interface AttackChatPlanResponse {
  reply: string;
  attackPlan: {
    scenarioName: string;
    targetVector: string;
    objective: string;
    phases: string[];
    exploitHypothesis: string;
    targetUrl?: string;
  };
  nodes: any[];
  edges: any[];
  discoveredVulnerabilities: Array<{
    id: string;
    title: string;
    severity: "Critical" | "High" | "Medium";
    cvss: number;
    nodeId: string;
    nodeLabel: string;
    vector: string;
    payload: string;
    reproductionPoc: string;
    impact: string;
    remediation: string;
    bypassed: boolean;
    bypassType: string;
  }>;
  overallRisk: "Critical" | "High" | "Medium" | "Clean";
  summary: string;
}

export async function fetchAttackChatPlan(params: AttackChatPlanRequest): Promise<AttackChatPlanResponse> {
  const res = await fetch("/api/flows/chat-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Attack flow planning failed with status ${res.status}`);
  }
  return res.json();
}

export class AgentCoordinator {
  private primaryAgent: Agent = {
    id: 'Sentinel-Prime',
    name: 'Sentinel-Prime',
    role: 'primary',
    specialization: 'Strategic Security Coordination',
    status: 'idle'
  };

  private subAgents: Agent[] = [
    { id: 'Infiltrator-X', name: 'Infiltrator-X', role: 'sub-agent', specialization: 'IDOR & SSRF Fuzzing', status: 'idle' },
    { id: 'Ghost-Scan', name: 'Ghost-Scan', role: 'sub-agent', specialization: 'OWASP Top 10 Scanning', status: 'idle' },
    { id: 'Vuln-Hunter', name: 'Vuln-Hunter', role: 'sub-agent', specialization: 'Vulnerability Analysis', status: 'idle' },
    { id: 'QA-Expert', name: 'QA-Expert', role: 'sub-agent', specialization: 'Automation', status: 'idle' },
    { id: 'AppSec-Engineer', name: 'AppSec-Engineer', role: 'sub-agent', specialization: 'Application Security', status: 'idle' },
    { id: 'Cloud-Sentry', name: 'Cloud-Sentry', role: 'sub-agent', specialization: 'Cloud Security', status: 'idle' },
    { id: 'API-Guardian', name: 'API-Guardian', role: 'sub-agent', specialization: 'API Security', status: 'idle' },
    { id: 'Crypto-Cracker', name: 'Crypto-Cracker', role: 'sub-agent', specialization: 'Cryptography', status: 'idle' },
    { id: 'Deep-Crawler', name: 'Deep-Crawler', role: 'sub-agent', specialization: 'Deep Web Crawling', status: 'idle' }
  ];

  constructor() {
    this.registerAgents();
  }

  private async registerAgents() {
    const agents = [this.primaryAgent, ...this.subAgents];
    for (const agent of agents) {
      try {
        await fetch('/api/agents/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agent)
        });
      } catch (e) {
        // silent init
      }
    }
  }

  private async logMessage(from: string, to: string, content: string, type: 'Status' | 'Command' | 'Finding') {
    try {
      await addDoc(collection(db, "messages"), {
        from,
        to,
        content,
        type,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log message:", error);
    }
  }

  async executeWorkflow(
    taskTitle: string,
    taskDescription: string,
    targetUrl?: string,
    testCaseId?: string,
    onTraceUpdate?: (trace: ToolExecutionTrace) => void
  ) {
    const effectiveTarget = targetUrl || "https://target.internal";
    await this.logMessage('Sentinel-Prime', 'All', `Initiating MCP-driven multi-agent workflow: ${taskTitle}`, 'Command');

    // Create tracking task in Firestore
    let taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    try {
      const taskRef = await addDoc(collection(db, "tasks"), {
        title: taskTitle,
        description: taskDescription,
        status: 'in-progress',
        assignedAgentId: this.primaryAgent.id,
        target: effectiveTarget,
        steps: [
          { step: 'Analyze Request & Reason with Gemini', status: 'in-progress' },
          { step: 'Coordinate Sub-Agents & Tool Calling', status: 'pending' },
          { step: 'Execute Security Tests & Crawling', status: 'pending' },
          { step: 'Consolidate Findings & Synthesis', status: 'pending' }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      taskId = taskRef.id;
    } catch (error) {
      console.warn("Could not create Firestore task document:", error);
    }

    try {
      // Execute Server-Side Native Gemini MCP Function Calling Audit
      const mcpResponse = await fetch("/api/agents/mcp-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: effectiveTarget,
          taskId,
          title: taskTitle,
          description: taskDescription,
          testCaseId
        })
      });

      if (!mcpResponse.ok) {
        throw new Error(`MCP audit endpoint returned status ${mcpResponse.status}`);
      }

      const mcpData = await mcpResponse.json();

      // Dispatch real-time traces callback if provided
      if (onTraceUpdate && Array.isArray(mcpData.toolTraces)) {
        for (const trace of mcpData.toolTraces) {
          onTraceUpdate(trace);
        }
      }

      // Update Firestore task status
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          status: 'completed',
          updatedAt: serverTimestamp(),
          steps: [
            { step: 'Analyze Request & Reason with Gemini', status: 'completed' },
            { step: 'Coordinate Sub-Agents & Tool Calling', status: 'completed' },
            { step: 'Execute Security Tests & Crawling', status: 'completed' },
            { step: 'Consolidate Findings & Synthesis', status: 'completed' }
          ],
          results: JSON.stringify([...(mcpData.findings || []), ...(mcpData.evolvedFindings || [])]),
          executiveSummary: mcpData.executiveSummary
        });
      } catch (err) {
        console.warn("Error updating task doc in Firestore:", err);
      }

      return {
        finalReport: mcpData.fullReport || mcpData.executiveSummary,
        executiveSummary: mcpData.executiveSummary,
        notTested: mcpData.notTested || [],
        findings: [...(mcpData.findings || []), ...(mcpData.evolvedFindings || [])],
        toolTraces: mcpData.toolTraces || []
      };
    } catch (error: any) {
      console.error("Workflow execution failed:", error);
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          status: 'failed',
          updatedAt: serverTimestamp(),
          errorDetails: error.message
        });
      } catch (e) {
        // ignore
      }
      throw error;
    }
  }
}

export const agentCoordinator = new AgentCoordinator();
