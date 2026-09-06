import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Play, 
  ShieldAlert, 
  Copy, 
  Check, 
  RotateCcw, 
  X, 
  ChevronRight, 
  Zap, 
  Flame, 
  Bug, 
  Terminal, 
  FileCode,
  Lock,
  Globe,
  Database,
  Cloud,
  Layers,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Paperclip,
  CornerDownLeft
} from 'lucide-react';
import { fetchAttackChatPlan, AttackChatPlanResponse } from '../services/agentService';

export interface FlowAIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFlow: (nodes: any[], edges: any[], summary?: string) => void;
  onExecuteFlow?: (nodes: any[], edges: any[]) => void;
  onOpenPatch?: (finding: any) => void;
  initialPrompt?: string;
  currentNodes?: any[];
  currentEdges?: any[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attackPlan?: AttackChatPlanResponse['attackPlan'];
  nodes?: any[];
  edges?: any[];
  discoveredVulnerabilities?: AttackChatPlanResponse['discoveredVulnerabilities'];
  overallRisk?: string;
}

export const PREDEFINED_SCENARIOS = [
  {
    key: 'oauth_ato',
    label: 'OAuth 2.0 Account Takeover',
    shortDesc: 'State Fixation & Code Injection',
    severity: 'Critical',
    cvss: 9.4,
    icon: Lock,
    prompt: 'Plan and test an OAuth 2.0 Account Takeover attack via authorization code state fixation and redirect URI pollution'
  },
  {
    key: 'bola_exfiltration',
    label: 'BOLA Cross-Tenant Leak',
    shortDesc: 'Multi-Tenant IDOR & Invoicing Dump',
    severity: 'Critical',
    cvss: 9.3,
    icon: UsersIconPlaceholder,
    prompt: 'Plan and test a BOLA / IDOR attack against multi-tenant invoice endpoints to exfiltrate cross-tenant customer PII'
  },
  {
    key: 'ssrf_cloud',
    label: 'Blind SSRF Cloud Metadata',
    shortDesc: 'AWS/GCP IMDS IAM Role Theft',
    severity: 'Critical',
    cvss: 9.1,
    icon: Cloud,
    prompt: 'Plan and test a Blind SSRF attack targeting 169.254.169.254 cloud metadata to steal temporary IAM STS credentials'
  },
  {
    key: 'jwt_none_privilege',
    label: 'JWT alg:none to Superadmin',
    shortDesc: 'Signature Confusion & Role Escalation',
    severity: 'Critical',
    cvss: 9.2,
    icon: ShieldAlert,
    prompt: 'Plan and test a JWT algorithm confusion attack using alg: none to bypass signature verification and escalate to root superadmin'
  },
  {
    key: 'file_upload_rce',
    label: 'File Upload to RCE',
    shortDesc: 'Polyglot Web Shell Execution',
    severity: 'Critical',
    cvss: 9.8,
    icon: Flame,
    prompt: 'Plan and test an Unrestricted File Upload attack with a polyglot web shell payload leading to Remote Code Execution (RCE)'
  },
  {
    key: 'sqli_schema_dump',
    label: 'SQLi Schema & Credential Dump',
    shortDesc: 'UNION-based Relational Extraction',
    severity: 'High',
    cvss: 8.8,
    icon: Database,
    prompt: 'Plan and test a SQL Injection attack in the search catalog filter using UNION SELECT payloads to dump database schemas and passwords'
  }
];

function UsersIconPlaceholder(props: any) {
  return <Layers {...props} />;
}

export const FlowAIChatDrawer: React.FC<FlowAIChatDrawerProps> = ({
  isOpen,
  onClose,
  onApplyFlow,
  onExecuteFlow,
  onOpenPatch,
  initialPrompt,
  currentNodes = [],
  currentEdges = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isPlanning, setIsPlanning] = useState(false);
  const [copiedPocId, setCopiedPocId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const drawerFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleDrawerFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      if (file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setInputPrompt(prev => {
              const prefix = prev.trim() ? `${prev}\n\n` : '';
              return `${prefix}[Context from ${file.name}]:\n${content.slice(0, 1500)}`;
            });
          }
        };
        reader.readAsText(file);
      } else {
        setInputPrompt(prev => {
          const prefix = prev.trim() ? `${prev}\n\n` : '';
          return `${prefix}[Attached Context Asset: ${file.name}]`;
        });
      }
    }
  };

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: 'I am **Sentinel-Prime**, your Autonomous AppSec Attack Planner & Flow Architect. Enter any attack prompt or choose a dynamic predefined scenario below. I will formulate a multi-stage penetration plan, generate the visual attack flow graph, and simulate adversarial payloads to discover high-severity vulnerabilities.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Update input if initialPrompt changed and non-empty
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendPrompt = async (promptToSend?: string, scenarioKey?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text && !scenarioKey) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text || `Execute scenario: ${scenarioKey}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsPlanning(true);

    try {
      const history = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const planResult = await fetchAttackChatPlan({
        prompt: text,
        scenario: scenarioKey,
        history,
        testAttack: true
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: planResult.reply || planResult.summary || 'Attack flow planned and tested successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attackPlan: planResult.attackPlan,
        nodes: planResult.nodes,
        edges: planResult.edges,
        discoveredVulnerabilities: planResult.discoveredVulnerabilities,
        overallRisk: planResult.overallRisk
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Attack flow generation error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Attack Planning Interruption**: ${err.message || 'Failed to synthesize flow plan'}. Please refine your prompt or select one of the predefined attack scenarios.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsPlanning(false);
    }
  };

  const copyPoc = (id: string, poc: string) => {
    navigator.clipboard.writeText(poc);
    setCopiedPocId(id);
    setTimeout(() => setCopiedPocId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-space/80 backdrop-blur-md flex justify-end">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={`w-full ${isExpanded ? 'max-w-4xl xl:max-w-5xl' : 'max-w-2xl xl:max-w-3xl'} h-full bg-deep-space/95 border-l border-neon-cyan/30 flex flex-col shadow-2xl relative transition-all duration-300 ease-out`}
      >
        {/* Chat Drawer Header */}
        <div className="p-4 border-b border-border-subtle bg-surface/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-text-primary tracking-wide uppercase flex items-center gap-2">
                  <span>Flow AI Attack Planner</span>
                  <span className="text-[10px] text-neon-cyan font-mono px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center gap-1">
                    <Sparkles size={10} className="animate-pulse" />
                    Interactive Chat
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Generate attack flows from prompts, plan multi-stage penetration paths, and identify high-severity vulnerabilities.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-xl transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs"
              title={isExpanded ? "Collapse to Standard Width" : "Expand Drawer Width"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span className="text-[10px] text-text-muted hidden md:inline">{isExpanded ? 'Standard' : 'Expand'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-xl transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Predefined Scenarios Carousel */}
        <div className="px-4 py-2.5 bg-surface/30 border-b border-border-subtle shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Zap size={12} className="text-vivid-magenta" />
              Dynamic Predefined Scenarios:
            </span>
            <span className="text-[9px] text-text-muted font-mono">1-Click Plan & Test</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {PREDEFINED_SCENARIOS.map((sc) => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.key}
                  disabled={isPlanning}
                  onClick={() => handleSendPrompt(sc.prompt, sc.key)}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border-subtle hover:border-neon-cyan/50 hover:bg-neon-cyan/5 text-left shrink-0 transition-all flex items-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <div className="p-1 rounded bg-deep-space text-neon-cyan group-hover:scale-110 transition-transform">
                    <Icon size={12} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-text-primary group-hover:text-neon-cyan transition-colors flex items-center gap-1.5">
                      {sc.label}
                      <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                        sc.severity === 'Critical' ? 'bg-vivid-magenta/20 text-vivid-magenta' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {sc.severity} {sc.cvss}
                      </span>
                    </div>
                    <div className="text-[9px] text-text-muted truncate max-w-[140px]">{sc.shortDesc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-text-muted">
                {msg.sender === 'user' ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot size={12} className="text-neon-cyan" />
                    <span className="font-bold text-neon-cyan">Sentinel-Prime</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-neon-cyan/15 text-text-primary border border-neon-cyan/40 rounded-tr-none'
                    : 'bg-surface/80 text-text-primary border border-border-subtle rounded-tl-none shadow-lg'
                }`}
              >
                <div className="prose prose-invert prose-xs max-w-none">
                  {msg.text}
                </div>

                {/* Structured Attack Plan Section */}
                {msg.attackPlan && (
                  <div className="mt-3.5 p-3 rounded-xl bg-deep-space/70 border border-neon-cyan/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-black text-neon-cyan uppercase tracking-wide flex items-center gap-1.5">
                        <Zap size={13} />
                        {msg.attackPlan.scenarioName}
                      </div>
                      {msg.overallRisk && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          msg.overallRisk === 'Critical' 
                            ? 'bg-vivid-magenta text-white shadow-sm shadow-vivid-magenta/40' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          {msg.overallRisk} Risk
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-text-secondary">
                      <span className="text-text-muted font-bold">Target Vector: </span>
                      <span className="text-text-primary">{msg.attackPlan.targetVector}</span>
                    </div>

                    <div className="text-[11px] text-text-secondary">
                      <span className="text-text-muted font-bold">Objective: </span>
                      <span className="text-text-primary">{msg.attackPlan.objective}</span>
                    </div>

                    {msg.attackPlan.phases && msg.attackPlan.phases.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border-subtle/40">
                        <div className="text-[9px] font-black uppercase tracking-wider text-text-muted">Attack Phases:</div>
                        <div className="grid grid-cols-1 gap-1">
                          {msg.attackPlan.phases.map((phase, idx) => (
                            <div key={idx} className="text-[10px] text-text-secondary flex items-start gap-1.5 bg-surface/40 px-2 py-1 rounded">
                              <span className="text-neon-cyan font-bold">•</span>
                              <span>{phase}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.attackPlan.exploitHypothesis && (
                      <div className="text-[10px] text-text-muted italic bg-surface/30 p-2 rounded border border-border-subtle/30">
                        "{msg.attackPlan.exploitHypothesis}"
                      </div>
                    )}
                  </div>
                )}

                {/* Discovered High Severity Vulnerabilities Section */}
                {msg.discoveredVulnerabilities && msg.discoveredVulnerabilities.length > 0 && (
                  <div className="mt-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-vivid-magenta">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-vivid-magenta animate-pulse" />
                        <span>High-Severity Vulnerabilities Found ({msg.discoveredVulnerabilities.length})</span>
                      </div>
                      <span className="text-[9px] text-text-muted font-normal">Active PoC Exploitation</span>
                    </div>

                    {msg.discoveredVulnerabilities.map((vuln) => (
                      <div
                        key={vuln.id}
                        className="p-3 rounded-xl bg-vivid-magenta/5 border border-vivid-magenta/30 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-text-primary flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 ${
                              vuln.severity === 'Critical' 
                                ? 'bg-vivid-magenta text-white shadow-sm shadow-vivid-magenta/30' 
                                : 'bg-orange-500 text-white'
                            }`}>
                              {vuln.severity} {vuln.cvss}
                            </span>
                            <span>{vuln.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-neon-cyan bg-deep-space px-1.5 py-0.5 rounded border border-border-subtle shrink-0">
                            {vuln.nodeLabel}
                          </span>
                        </div>

                        <div className="text-[11px] text-text-secondary">
                          <span className="text-text-muted font-bold">Vector: </span>
                          <span className="text-text-primary">{vuln.vector}</span>
                        </div>

                        {vuln.payload && (
                          <div className="text-[10px] font-mono bg-deep-space/80 p-2 rounded border border-border-subtle text-yellow-300 break-all">
                            <span className="text-text-muted select-none">Payload: </span>
                            {vuln.payload}
                          </div>
                        )}

                        {vuln.reproductionPoc && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-bold text-text-muted uppercase">
                              <span className="flex items-center gap-1">
                                <Terminal size={10} />
                                Reproducible PoC (curl)
                              </span>
                              <button
                                onClick={() => copyPoc(vuln.id, vuln.reproductionPoc)}
                                className="flex items-center gap-1 text-neon-cyan hover:underline cursor-pointer"
                              >
                                {copiedPocId === vuln.id ? (
                                  <>
                                    <Check size={10} /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2 rounded bg-deep-space text-[10px] font-mono text-lime-green overflow-x-auto border border-border-subtle select-all">
                              {vuln.reproductionPoc}
                            </pre>
                          </div>
                        )}

                        <div className="text-[11px] text-text-secondary">
                          <span className="text-text-muted font-bold">Impact: </span>
                          <span>{vuln.impact}</span>
                        </div>

                        <div className="text-[11px] text-lime-green bg-lime-green/5 p-2 rounded border border-lime-green/20">
                          <span className="font-bold">Remediation: </span>
                          {vuln.remediation}
                        </div>

                        {/* Patch Synthesizer Action */}
                        {onOpenPatch && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => onOpenPatch(vuln)}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-vivid-magenta/40 hover:bg-vivid-magenta/15 text-vivid-magenta text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FileCode size={12} />
                              Synthesize Git Diff Patch
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Flow Canvas Sync Actions */}
                {msg.nodes && msg.nodes.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-border-subtle flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onApplyFlow(msg.nodes || [], msg.edges || [], msg.attackPlan?.scenarioName)}
                      className="px-3 py-1.5 bg-neon-cyan text-deep-space text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-md shadow-neon-cyan/20 cursor-pointer"
                    >
                      <Layers size={12} />
                      Apply Flow to Canvas ({msg.nodes.length} Nodes)
                    </button>

                    {onExecuteFlow && (
                      <button
                        onClick={() => onExecuteFlow(msg.nodes || [], msg.edges || [])}
                        className="px-3 py-1.5 bg-vivid-magenta text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-1.5 shadow-md shadow-vivid-magenta/20 cursor-pointer"
                      >
                        <Play size={12} fill="currentColor" />
                        Execute Attack on Canvas
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isPlanning && (
            <div className="flex items-start gap-2">
              <div className="p-2 rounded-xl bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
                <Bot size={16} />
              </div>
              <div className="bg-surface p-3.5 rounded-2xl rounded-tl-none border border-neon-cyan/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neon-cyan">
                  <div className="w-3.5 h-3.5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                  <span>Sentinel-Prime is planning attack & testing vulnerabilities...</span>
                </div>
                <div className="text-[10px] text-text-muted">
                  Synthesizing ingress vectors, mapping attack flow graph, and testing adversarial payloads for high-severity flaws.
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 border-t border-border-subtle bg-surface/85 backdrop-blur-sm shrink-0">
          {/* Quick attack prompts suggestion bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[10px]">
            <span className="text-text-muted font-bold tracking-wider uppercase text-[9px] shrink-0 flex items-center gap-1">
              <Zap size={10} className="text-neon-cyan" />
              Quick:
            </span>
            {[
              { label: 'SSRF Cloud Metadata', prompt: 'Simulate SSRF against AWS metadata endpoint 169.254.169.254 to steal IAM credentials' },
              { label: 'BOLA Tenant Leak', prompt: 'Probe user profile API for BOLA / IDOR vulnerability by tampering with tenant IDs' },
              { label: 'OAuth 2.0 Takeover', prompt: 'Perform OAuth 2.0 Account Takeover with unvalidated redirect_uri and code theft' },
              { label: 'JWT none Bypass', prompt: 'Forge a JWT with alg:none and escalate role to SuperAdmin' },
              { label: 'File Upload RCE', prompt: 'Upload a polyglot executable payload disguised as image/png to trigger RCE' },
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputPrompt(q.prompt)}
                className="px-2 py-0.5 rounded-lg bg-deep-space/80 hover:bg-neon-cyan/15 text-text-secondary hover:text-neon-cyan border border-border-subtle/80 hover:border-neon-cyan/40 shrink-0 text-[10px] transition-all cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Form with textarea and file attachment */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex flex-col gap-2 bg-deep-space/90 border border-border-subtle focus-within:border-neon-cyan rounded-2xl p-2.5 transition-all shadow-inner"
          >
            {/* Attached file chip */}
            {attachedFileName && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Paperclip size={12} className="shrink-0" />
                  <span className="truncate">{attachedFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFileName(null)}
                  className="hover:text-white transition-colors cursor-pointer ml-2 p-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputPrompt.trim() && !isPlanning) {
                    handleSendPrompt();
                  }
                }
              }}
              placeholder="Describe penetration scenario, paste API endpoints, cURL payloads, or GraphQL queries... (Shift+Enter for new line)"
              disabled={isPlanning}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 outline-none resize-none font-mono min-h-[48px] max-h-[140px] leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-border-subtle/40">
              <div className="flex items-center gap-1.5">
                {/* Hidden File Input */}
                <input
                  ref={drawerFileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml,.txt,.png,.jpg,.jpeg,.svg,.pdf"
                  className="hidden"
                  onChange={handleDrawerFileAttach}
                />
                <button
                  type="button"
                  onClick={() => drawerFileInputRef.current?.click()}
                  className="p-1.5 text-text-muted hover:text-neon-cyan hover:bg-surface rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Attach Context Document or API Spec"
                >
                  <Paperclip size={14} />
                  <span className="hidden sm:inline text-[10px]">Attach Spec</span>
                </button>
                {inputPrompt.trim() && (
                  <button
                    type="button"
                    onClick={() => setInputPrompt('')}
                    className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-[10px]"
                    title="Clear text"
                  >
                    Clear
                  </button>
                )}
                <span className="text-[9px] text-text-muted font-mono hidden sm:inline pl-1">
                  ↵ to send • Shift+↵ for newline
                </span>
              </div>

              <button
                type="submit"
                disabled={isPlanning || !inputPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-cyan-400 text-deep-space font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-neon-cyan/20 cursor-pointer shrink-0"
              >
                <Send size={13} />
                <span>Send</span>
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-1 mt-2 px-1 text-[9px] text-text-muted">
            <span className="flex items-center gap-1 font-mono">
              <Sparkles size={10} className="text-neon-cyan" />
              Sentinel AI Autonomous Orchestration & Gemini 3.1 Pro
            </span>
            <span className="font-mono">Zero-Trust Guardrail Enforced</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
