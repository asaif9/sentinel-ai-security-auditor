import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Zap, 
  Code, 
  X, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { PatchModal } from './PatchModal';

interface FlowAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: any;
  isLoading: boolean;
}

export const FlowAuditModal: React.FC<FlowAuditModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  isLoading
}) => {
  const [selectedFindingForPatch, setSelectedFindingForPatch] = useState<any>(null);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-deep-space/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface border border-vivid-magenta/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border-subtle flex items-start sm:items-center justify-between gap-3 bg-surface-card">
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="p-2.5 rounded-2xl bg-vivid-magenta/10 text-vivid-magenta border border-vivid-magenta/30 shrink-0">
                  <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-vivid-magenta">
                      Flow-to-Audit Adversarial Injection Engine
                    </span>
                    {auditResult?.overallRisk && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                        auditResult.overallRisk === 'Critical' 
                          ? 'bg-vivid-magenta text-white' 
                          : auditResult.overallRisk === 'High' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-lime-green text-deep-space'
                      }`}>
                        {auditResult.overallRisk} Risk
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary mt-0.5 truncate">
                    Canvas Node Sequence Security Verification
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-3 border-vivid-magenta border-t-transparent rounded-full animate-spin" />
                  <div className="text-sm font-bold text-vivid-magenta">
                    Executing canvas nodes sequentially with adversarial payloads...
                  </div>
                  <div className="text-xs text-text-muted">
                    Injecting JWT alg: none, OTP bypasses, SVG XSS, and Webhook replays
                  </div>
                </div>
              ) : auditResult ? (
                <>
                  {/* Summary Banner */}
                  <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-text-muted">
                        Audit Verdict
                      </div>
                      <div className="text-sm font-bold text-text-primary mt-0.5">
                        {auditResult.summary}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-vivid-magenta/10 border border-vivid-magenta/30 text-vivid-magenta text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        {auditResult.vulnerableNodeIds?.length || 0} Bypasses Found
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Injection Traces */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-neon-cyan" />
                      Sequential Node Ingress & Payload Traces
                    </h4>

                    <div className="space-y-3">
                      {auditResult.executionSteps?.map((step: any, idx: number) => {
                        const isVuln = step.verdict === 'VULNERABLE';
                        return (
                          <div
                            key={step.nodeId || idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              isVuln
                                ? 'bg-vivid-magenta/5 border-vivid-magenta/40'
                                : 'bg-surface-card border-border-subtle'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
                                  Step {idx + 1}
                                </span>
                                <strong className="text-sm text-text-primary">
                                  {step.nodeLabel}
                                </strong>
                                <span className="text-[10px] uppercase font-mono text-neon-cyan">
                                  ({step.nodeType})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-text-muted">
                                  HTTP {step.status} • {step.latencyMs}ms
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    isVuln
                                      ? 'bg-vivid-magenta text-white'
                                      : 'bg-lime-green/20 text-lime-green border border-lime-green/30'
                                  }`}
                                >
                                  {step.verdict}
                                </span>
                              </div>
                            </div>

                            {/* Payload Details */}
                            <div className="p-2.5 rounded-xl bg-deep-space border border-border-subtle font-mono text-xs text-text-muted flex items-center gap-2 overflow-x-auto">
                              <span className="text-vivid-magenta font-bold shrink-0">Payload Injected:</span>
                              <code className="text-text-primary">{step.payloadInjected}</code>
                            </div>

                            {/* Finding Box if Vulnerable */}
                            {step.finding && (
                              <div className="mt-3 pt-3 border-t border-vivid-magenta/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs font-bold text-vivid-magenta flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    {step.finding.title}
                                  </div>
                                  <p className="text-xs text-text-muted mt-0.5 max-w-xl leading-relaxed">
                                    {step.finding.description}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setSelectedFindingForPatch({
                                    title: step.finding.title,
                                    severity: step.finding.severity,
                                    description: step.finding.description,
                                    remediation: step.finding.remediation,
                                    asset: step.nodeLabel
                                  })}
                                  className="px-3 py-1.5 bg-neon-cyan text-deep-space rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:bg-cyan-400 transition-colors shadow-md shadow-neon-cyan/20"
                                >
                                  <Code className="w-3.5 h-3.5" />
                                  Synthesize Patch
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Render Patch Modal if a finding is chosen */}
      {selectedFindingForPatch && (
        <PatchModal
          isOpen={true}
          onClose={() => setSelectedFindingForPatch(null)}
          finding={selectedFindingForPatch}
        />
      )}
    </>
  );
};
