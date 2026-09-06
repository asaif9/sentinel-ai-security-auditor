import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Code, 
  Layers, 
  Search, 
  ShieldAlert, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ToolExecutionTrace } from '../services/agentService';
import { PatchModal } from './PatchModal';

interface McpTraceTerminalProps {
  traces: ToolExecutionTrace[];
  isOrchestrating?: boolean;
  onSynthesizePatch?: (finding: any) => void;
}

export const McpTraceTerminal: React.FC<McpTraceTerminalProps> = ({
  traces,
  isOrchestrating,
  onSynthesizePatch
}) => {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [selectedFindingForPatch, setSelectedFindingForPatch] = useState<any>(null);

  const toggleExpand = (id: string) => {
    setExpandedTraceId(prev => prev === id ? null : id);
  };

  // Default fallback realistic traces if none yet executed
  const displayTraces: ToolExecutionTrace[] = traces.length > 0 ? traces : [
    {
      id: "trace_default_1",
      agent: "Sentinel-Prime",
      subAgent: "Deep-Crawler",
      action: "Trigger Deep Web Crawling (Crawl4AI Engine)",
      toolName: "trigger_crawl",
      args: { url: "https://target.internal", engine: "crawl4ai", depth: 2 },
      result: { status: "success", pages_found: ["/api/v1/auth", "/redirect?target=", "/api/v1/users/102"] },
      summary: "Discovered 6 routes including unvalidated redirect and user profile endpoints.",
      timestamp: new Date().toISOString(),
      status: "success"
    },
    {
      id: "trace_default_2",
      agent: "Sentinel-Prime",
      subAgent: "Ghost-Scan",
      action: "OWASP Top 10 Probe (open_redirect)",
      toolName: "run_owasp_scan",
      args: { targetUrl: "https://target.internal/redirect", vector: "open_redirect" },
      result: { exploitObserved: true, evidence: "HTTP 302 to https://evil.corp", cvss: 7.4 },
      summary: "Ghost-Scan detected Unvalidated Open Redirect vulnerability.",
      timestamp: new Date().toISOString(),
      status: "exploited"
    },
    {
      id: "trace_default_3",
      agent: "Sentinel-Prime",
      subAgent: "Vuln-Hunter",
      action: "Exploit Verification & PoC Formulation",
      toolName: "verify_vulnerability_exploit",
      args: { vulnerabilityType: "Unvalidated Open Redirect", targetUrl: "https://target.internal/redirect" },
      result: { confirmedExploitable: true, cvssScore: 7.4, falsePositiveEliminated: true },
      summary: "Vuln-Hunter confirmed 100% exploit viability with valid reproduction PoC.",
      timestamp: new Date().toISOString(),
      status: "exploited"
    }
  ];

  return (
    <div className="bg-surface-card rounded-3xl border border-border-subtle overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border-subtle bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">
                MCP Native Function Calling Protocol
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 font-bold">
                Gemini 3.1 Pro Preview
              </span>
            </div>
            <h4 className="text-base font-bold text-text-primary mt-0.5">
              Sentinel-Prime ➔ Sub-Agent Invocation Trace
            </h4>
          </div>
        </div>

        {/* Multi-Agent Delegation Flow Banner */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono text-text-muted bg-deep-space/60 px-3 py-2 rounded-2xl border border-border-subtle">
          <span className="text-neon-cyan font-bold">Sentinel-Prime</span>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-orange-400 font-bold">Ghost-Scan</span>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-vivid-magenta font-bold">Vuln-Hunter</span>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-lime-green font-bold">AppSec-Engineer</span>
        </div>
      </div>

      {/* Traces Stream */}
      <div className="p-4 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto font-mono text-xs">
        {displayTraces.map((trace, idx) => {
          const isExploited = trace.status === "exploited";
          const isExpanded = expandedTraceId === trace.id;

          return (
            <motion.div
              key={trace.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExploited
                  ? 'bg-vivid-magenta/5 border-vivid-magenta/40'
                  : 'bg-deep-space/70 border-border-subtle hover:border-neon-cyan/40'
              }`}
            >
              {/* Trace Row */}
              <div 
                onClick={() => toggleExpand(trace.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${
                    isExploited
                      ? 'bg-vivid-magenta text-white shadow-md shadow-vivid-magenta/20'
                      : 'bg-surface text-neon-cyan border border-neon-cyan/20'
                  }`}>
                    {isExploited ? <Zap className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-neon-cyan font-bold">{trace.agent}</span>
                      <ArrowRight className="w-3 h-3 text-text-muted" />
                      <span className="text-text-primary font-bold">{trace.subAgent}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
                        Tool: <code className="text-neon-cyan">{trace.toolName}</code>
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-1 font-sans">
                      {trace.summary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    isExploited
                      ? 'bg-vivid-magenta/20 text-vivid-magenta border border-vivid-magenta/40'
                      : 'bg-lime-green/20 text-lime-green border border-lime-green/40'
                  }`}>
                    {isExploited ? 'Exploited' : 'Verified'}
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border-subtle/60 p-4 bg-deep-space/90 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                          Tool Call Arguments (MCP Schema):
                        </div>
                        <pre className="p-3 rounded-xl bg-surface border border-border-subtle text-text-secondary text-[11px] overflow-x-auto">
                          {JSON.stringify(trace.args, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                          Server / Crawler Execution Output:
                        </div>
                        <pre className="p-3 rounded-xl bg-surface border border-border-subtle text-text-secondary text-[11px] overflow-x-auto">
                          {JSON.stringify(trace.result, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {isExploited && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const finding = {
                              title: trace.action,
                              severity: "High",
                              description: trace.summary,
                              remediation: "Review server route and apply input validation.",
                              asset: trace.args.targetUrl || trace.args.target || "Endpoint"
                            };
                            setSelectedFindingForPatch(finding);
                          }}
                          className="px-4 py-2 bg-neon-cyan text-deep-space rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-neon-cyan/20 hover:bg-cyan-400 transition-colors"
                        >
                          <Code className="w-4 h-4" />
                          Synthesize AppSec Git Diff Patch
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Render Patch Modal if triggered */}
      {selectedFindingForPatch && (
        <PatchModal
          isOpen={true}
          onClose={() => setSelectedFindingForPatch(null)}
          finding={selectedFindingForPatch}
        />
      )}
    </div>
  );
};
