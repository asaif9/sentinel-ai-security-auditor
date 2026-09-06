import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Code, 
  Copy, 
  Download, 
  X, 
  Check, 
  Terminal, 
  Layers, 
  Lock, 
  FileCode, 
  Cpu
} from 'lucide-react';
import { fetchAppSecPatch, PatchResult } from '../services/agentService';

interface PatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: any;
  framework?: string;
  patchResult?: PatchResult | null;
}

export const PatchModal: React.FC<PatchModalProps> = ({
  isOpen,
  onClose,
  finding,
  framework = "express",
  patchResult: initialPatchResult
}) => {
  const [selectedFramework, setSelectedFramework] = useState(framework);
  const [patchData, setPatchData] = useState<PatchResult | null>(initialPatchResult || null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'verification'>('diff');

  const frameworks = [
    { id: 'express', name: 'Node.js / Express', icon: '🟢' },
    { id: 'fastapi', name: 'Python / FastAPI', icon: '🐍' },
    { id: 'spring', name: 'Java / Spring Boot', icon: '☕' },
    { id: 'nextjs', name: 'TypeScript / Next.js', icon: '▲' }
  ];

  useEffect(() => {
    if (isOpen && finding) {
      loadPatch(selectedFramework);
    }
  }, [isOpen, finding, selectedFramework]);

  const loadPatch = async (fw: string) => {
    setIsLoading(true);
    try {
      const res = await fetchAppSecPatch(finding, fw);
      setPatchData(res);
    } catch (e) {
      console.error("Failed to load patch in modal:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (patchData?.patchDiff) {
      navigator.clipboard.writeText(patchData.patchDiff);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (patchData?.patchDiff) {
      const blob = new Blob([patchData.patchDiff], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${finding?.title ? finding.title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'security'}.patch`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-deep-space/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface border border-neon-cyan/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border-subtle flex items-start sm:items-center justify-between gap-3 bg-surface-card">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-2xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">
                    AppSec-Engineer Autonomous Synthesis
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-vivid-magenta/20 text-vivid-magenta border border-vivid-magenta/30 font-bold">
                    {finding?.severity || 'High'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary mt-0.5 truncate">
                  Unified Git Diff: {finding?.title || "Security Vulnerability Patch"}
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

          {/* Framework Selector */}
          <div className="px-4 sm:px-6 py-3 border-b border-border-subtle bg-deep-space/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <Layers className="w-4 h-4 text-text-muted" />
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Target:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setSelectedFramework(fw.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedFramework === fw.id
                        ? 'bg-neon-cyan text-deep-space font-black shadow-md shadow-neon-cyan/20'
                        : 'bg-surface border border-border-subtle text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span>{fw.icon}</span>
                    <span>{fw.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                disabled={!patchData?.patchDiff}
                className="px-3 py-1.5 bg-surface border border-border-subtle text-text-primary hover:border-neon-cyan rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-lime-green" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Diff'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!patchData?.patchDiff}
                className="px-3 py-1.5 bg-neon-cyan text-deep-space rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-neon-cyan/20 hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download .patch
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-3 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-bold text-neon-cyan">
                  AppSec-Engineer is synthesizing unified diff with Gemini...
                </div>
                <div className="text-xs text-text-muted">
                  Ensuring complete bypass neutralization across edge cases
                </div>
              </div>
            ) : patchData ? (
              <>
                {/* Why It Prevents Bypasses Callout */}
                <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-lime-green">
                    <ShieldCheck className="w-4 h-4" />
                    Why This Patch Neutralizes Exploit Chains
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {patchData.whyItPreventsBypasses}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {patchData.bypassesNeutralized?.map((bp, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-lime-green/10 text-lime-green border border-lime-green/30 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        {bp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-text-muted px-1">
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-neon-cyan" />
                      Target: <strong className="text-text-primary">{patchData.fileName}</strong>
                    </span>
                    <span className="text-[10px] text-text-muted">Standard Unified Diff (Git / Patch)</span>
                  </div>

                  <div className="bg-deep-space border border-border-subtle rounded-2xl overflow-hidden font-mono text-xs">
                    <div className="p-4 overflow-x-auto space-y-0.5 leading-5 max-h-96">
                      {patchData.patchDiff.split('\n').map((line, idx) => {
                        let lineStyle = "text-text-muted";
                        let bgStyle = "bg-transparent";

                        if (line.startsWith('+++') || line.startsWith('---')) {
                          lineStyle = "text-text-primary font-bold";
                        } else if (line.startsWith('+')) {
                          lineStyle = "text-lime-green font-semibold";
                          bgStyle = "bg-lime-green/10 px-1 rounded-sm";
                        } else if (line.startsWith('-')) {
                          lineStyle = "text-vivid-magenta font-semibold";
                          bgStyle = "bg-vivid-magenta/10 px-1 rounded-sm";
                        } else if (line.startsWith('@@')) {
                          lineStyle = "text-neon-cyan font-bold";
                          bgStyle = "bg-neon-cyan/10 px-1 rounded-sm";
                        }

                        return (
                          <div key={idx} className={`${lineStyle} ${bgStyle} whitespace-pre`}>
                            {line || ' '}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Verification Snippet */}
                {patchData.verificationSnippet && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider px-1">
                      <Terminal className="w-3.5 h-3.5 text-neon-cyan" />
                      Automated Verification Test Snippet
                    </div>
                    <pre className="p-4 bg-deep-space border border-border-subtle rounded-2xl overflow-x-auto font-mono text-xs text-text-secondary leading-relaxed">
                      {patchData.verificationSnippet}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-text-muted text-xs">
                No patch generated for this vulnerability. Click a framework above to generate.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
