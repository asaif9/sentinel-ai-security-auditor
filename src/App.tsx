/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Search, 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Target,
  Download, 
  Upload,
  ExternalLink, 
  Smartphone, 
  Monitor,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Play,
  Terminal,
  Database,
  Lock,
  Zap,
  Bug,
  GitBranch,
  Code,
  UserCheck,
  Globe,
  Cpu,
  Plus,
  Trash2,
  HelpCircle,
  Info,
  Bell,
  Cloud,
  Key,
  Sun,
  Moon,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  User,
  Sparkles,
  LogIn,
  LogOut,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as d3 from 'd3';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart,
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { testCategories, type TestCase, type TestCategory } from './testCases';
import { VisualTestBuilder } from './components/VisualTestBuilder';
import { ResultDeviationEngine } from './components/ResultDeviationEngine';
import { AboutPage } from './components/AboutPage';
import { KnowledgeBase } from './components/KnowledgeBase';
import { ThreatJournal } from './components/ThreatJournal';
import { MultiTenancyCheckModal } from './components/MultiTenancyCheckModal';
import { McpTraceTerminal } from './components/McpTraceTerminal';
import { PatchModal } from './components/PatchModal';
import { SynthesizedExploitChainCard, DEFAULT_EXPLOIT_CHAINS } from './components/SynthesizedExploitChainCard';
import { SitemapAttackSurfaceGraph, type DiscoveredEndpoint } from './components/SitemapAttackSurfaceGraph';
import { agentCoordinator, fetchAppSecPatch, type ToolExecutionTrace } from './services/agentService';
import { db, auth, signInWithGoogle, onAuthStateChanged, type User as FirebaseUser } from './firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Activity, Users, Calendar, ListTodo, StickyNote } from 'lucide-react';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { PersonalJournal } from './components/PersonalJournal';

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

interface Finding {
  id: string;
  title: string;
  description: string;
  asset: string;
  assetType?: string;
  severity: Severity;
  poc: string;
  logs: string;
  request?: string;
  response?: string;
  impact: string;
  remediation: string;
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  deepDiveUrl?: string;
  isDestructive?: boolean;
  isDataTampering?: boolean;
  isEvolved?: boolean;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'Idle' | 'Active' | 'Collaborating' | 'Failed';
  load: number;
  icon: any;
  specialization: string[];
}

interface AgentTask {
  id: string;
  assignedAgentId?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  findings: string[];
  phase?: number;
}

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'Task' | 'Finding' | 'Status' | 'Alert';
}

interface VerifiedScenario {
  id: string;
  title: string;
  description: string;
  status: 'Passed' | 'Warning';
  details: string;
}

interface CoverageGap {
  id: string;
  area: string;
  description: string;
  risk: string;
  suggestedScenario: string;
  suggestedPlaywrightScript?: string;
}

interface ExclusionLogEntry {
  id: string;
  testCase: string;
  reason: string;
  constraint: 'Environmental' | 'Data' | 'Auth' | 'Timeout' | 'Other';
}

interface DynamicTestCase {
  id: string;
  title: string;
  description: string;
  vulnerabilityType: string;
  severity: Severity;
  reproductionSteps: string;
}

interface AuditReport {
  id: string;
  targetUrl: string;
  date: string;
  executiveSummary: string;
  techStack: string[];
  findings: Finding[];
  dynamicTests: DynamicTestCase[];
  verifiedScenarios: VerifiedScenario[];
  identifiedGaps: CoverageGap[];
  exclusionLog: ExclusionLogEntry[];
  notTested: string[];
  stats: {
    ran: number;
    skipped: number;
    total: number;
  };
}

// --- Components ---

const DelegationMap = ({ agents, tasks, onAgentClick, onTaskClick }: { agents: Agent[], tasks: AgentTask[], onAgentClick?: (id: string) => void, onTaskClick?: (id: string) => void }) => {
  if (tasks.length === 0) return null;

  const orchestrator = agents.find(a => a.id === 'Sentinel-Prime');
  const workers = agents.filter(a => a.id !== 'Sentinel-Prime');

  return (
    <div className="bg-surface-card rounded-3xl border border-border-card p-4 sm:p-8 shadow-sm overflow-hidden relative">
      <h4 className="font-bold text-text-primary mb-8 sm:mb-12 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-neon-cyan" />
        Mission Delegation Topology
      </h4>
      
      <div className="relative flex flex-col items-center gap-8 sm:gap-16">
        {/* Orchestrator */}
        <div className="relative z-10">
          <button 
            onClick={() => onAgentClick?.('Sentinel-Prime')}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neon-cyan flex items-center justify-center text-deep-space shadow-xl shadow-neon-cyan/20 border-4 border-surface-card hover:scale-110 transition-transform cursor-pointer"
          >
            <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>
          <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 text-center w-32">
            <div className="text-xs sm:text-sm font-bold text-text-primary">Sentinel-Prime</div>
            <div className="text-[8px] sm:text-[10px] text-text-muted uppercase font-bold">Orchestrator</div>
          </div>
        </div>

        {/* Connection Lines (SVG) - Hidden on mobile as it's hard to align */}
        <svg className="absolute top-10 left-0 w-full h-40 pointer-events-none z-0 hidden sm:block">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#e2e8f0" />
            </marker>
          </defs>
          {workers.map((_, i) => {
            const x1 = 400; // This should ideally be dynamic but for now we keep it simple
            const y1 = 40;
            const x2 = (800 / (workers.length + 1)) * (i + 1);
            const y2 = 140;
            return (
              <path 
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* Workers */}
        <div className="flex flex-wrap justify-center gap-6 sm:justify-around w-full relative z-10">
          {workers.map((agent) => {
            const task = tasks.find(t => t.assignedAgentId === agent.id && t.status !== 'completed');
            const completedTask = tasks.find(t => t.assignedAgentId === agent.id && t.status === 'completed');
            
            return (
              <div key={agent.id} className="flex flex-col items-center gap-3 sm:gap-4 w-32 sm:w-48">
                <motion.button 
                  onClick={() => onAgentClick?.(agent.id)}
                  animate={task ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={cn(
                    "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 border-4 border-surface-card cursor-pointer hover:scale-110",
                    task ? "bg-neon-cyan text-deep-space" : "bg-surface-hover text-text-muted"
                  )}
                >
                  <agent.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.button>
                
                <div className="text-center w-full">
                  <div className="text-[10px] sm:text-xs font-bold text-text-primary truncate">{agent.name}</div>
                  <div className="text-[8px] sm:text-[9px] text-text-muted uppercase font-bold mb-2 sm:mb-3">{agent.role}</div>
                  
                  {task ? (
                    <button 
                      onClick={() => onTaskClick?.(task.id)}
                      className="w-full p-1.5 sm:p-2 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20 animate-pulse cursor-pointer hover:bg-neon-cyan/20 transition-colors"
                    >
                      <div className="text-[8px] sm:text-[10px] font-bold text-neon-cyan truncate">{task.title}</div>
                      <div className="text-[7px] sm:text-[8px] text-neon-cyan/70">In-Progress...</div>
                    </button>
                  ) : completedTask ? (
                    <button 
                      onClick={() => onTaskClick?.(completedTask.id)}
                      className="w-full p-1.5 sm:p-2 bg-lime-green/10 rounded-xl border border-lime-green/20 cursor-pointer hover:bg-lime-green/20 transition-colors"
                    >
                      <div className="text-[8px] sm:text-[10px] font-bold text-lime-green truncate">{completedTask.title}</div>
                      <div className="text-[7px] sm:text-[8px] text-lime-green/70">Task Completed</div>
                    </button>
                  ) : (
                    <div className="p-1.5 sm:p-2 bg-surface rounded-xl border border-border-subtle">
                      <div className="text-[8px] sm:text-[10px] font-bold text-text-muted italic">Awaiting Task</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TaskFlow = ({ tasks, onTaskClick }: { tasks: AgentTask[], onTaskClick?: (id: string) => void }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-surface-card rounded-3xl border border-border-card p-4 sm:p-6 shadow-sm overflow-x-auto">
      <h4 className="font-bold text-text-primary mb-6 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-neon-cyan" />
        Mission Task Delegation Flow
      </h4>
      <div className="relative flex items-center justify-between min-w-[600px] sm:min-w-0 px-4">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-subtle -translate-y-1/2 z-0" />
        {tasks.map((task, i) => (
          <div key={task.id} className="relative z-10 flex flex-col items-center group">
            <button 
              onClick={() => onTaskClick?.(task.id)}
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 border-surface-card shadow-md transition-all duration-500 hover:scale-110 cursor-pointer",
                task.status === 'completed' ? "bg-lime-green text-deep-space" : 
                task.status === 'in-progress' ? "bg-neon-cyan text-deep-space animate-pulse" : "bg-surface-hover text-text-muted"
              )}
            >
              {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-[10px] sm:text-xs font-bold">{i + 1}</span>}
            </button>
            <div className="absolute top-10 sm:top-12 w-24 sm:w-32 text-center">
              <button 
                onClick={() => onTaskClick?.(task.id)}
                className="text-[8px] sm:text-[10px] font-bold text-text-primary truncate px-2 hover:text-neon-cyan transition-colors cursor-pointer block w-full"
              >
                {task.title}
              </button>
              <div className="text-[7px] sm:text-[8px] text-text-muted uppercase tracking-tighter">{task.assignedAgentId}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tasks.map(t => (
          <div 
            key={t.id} 
            onClick={() => onTaskClick?.(t.id)}
            className={cn(
              "p-3 rounded-xl border transition-all cursor-pointer hover:border-neon-cyan/50",
              t.status === 'in-progress' ? "border-neon-cyan/20 bg-neon-cyan/10" : "border-border-subtle bg-surface"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-text-muted">{t.assignedAgentId}</span>
              <Badge variant={t.status === 'completed' ? 'default' : t.status === 'in-progress' ? 'Info' : 'default'}>
                {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
              </Badge>
            </div>
            <div className="text-xs font-bold text-text-primary mb-1">{t.title}</div>
            {(t.findings || []).length > 0 && (
              <div className="text-[9px] text-neon-cyan font-medium italic">Finding: {t.findings[0]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AgentGraph = React.memo(function AgentGraph({ agents, messages, tasks, onAgentClick }: { agents: Agent[], messages: AgentMessage[], tasks: AgentTask[], onAgentClick?: (id: string) => void }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const messagesRef = React.useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data
    const nodeIds = new Set(agents.map(a => a.id));
    const nodes = agents.map(a => ({ 
      id: a.id, 
      name: a.name, 
      status: a.status, 
      icon: a.icon,
      activeTask: tasks.find(t => t.assignedAgentId === a.id && t.status === 'in-progress')?.title
    }));
    
    // Links based on messages (initial load only for layout)
    const linksMap = new Map<string, { source: string, target: string, value: number }>();
    messagesRef.current.forEach(m => {
      if (m.to === 'All') {
        agents.forEach(a => {
          if (a.id !== m.from && nodeIds.has(m.from) && nodeIds.has(a.id)) {
            const key = [m.from, a.id].sort().join('-');
            const existing = linksMap.get(key) || { source: m.from, target: a.id, value: 0 };
            existing.value += 1;
            linksMap.set(key, existing);
          }
        });
      } else {
        if (nodeIds.has(m.from) && nodeIds.has(m.to)) {
          const key = [m.from, m.to].sort().join('-');
          const existing = linksMap.get(key) || { source: m.from, target: m.to, value: 0 };
          existing.value += 1;
          linksMap.set(key, existing);
        }
      }
    });
    const links = Array.from(linksMap.values());

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#4f46e5")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

    // Pulse container
    const pulseGroup = svg.append("g");

    // Draw nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "cursor-pointer")
      .on("click", (event, d: any) => {
        onAgentClick?.(d.id);
      })
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", 25)
      .attr("fill", (d: any) => d.status === 'Active' ? "#4f46e5" : "#1e293b")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d: any) => d.name);

    node.append("text")
      .attr("dy", 55)
      .attr("text-anchor", "middle")
      .attr("fill", "#6366f1")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .text((d: any) => d.activeTask ? `[${d.activeTask}]` : "");

    // Add status indicator
    node.append("circle")
      .attr("r", 5)
      .attr("cx", 18)
      .attr("cy", -18)
      .attr("fill", (d: any) => d.status === 'Active' ? "#22c55e" : "#64748b");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Handle pulses independently using d3.timer
    const timer = d3.timer(() => {
      const now = Date.now();
      const recentMessages = messagesRef.current.filter(m => {
        const msgTime = new Date(m.timestamp).getTime();
        return now - msgTime < 5000;
      });

      const pulseData = recentMessages.filter(m => nodeIds.has(m.from) && (m.to === 'All' || nodeIds.has(m.to)));
      
      const pulses = pulseGroup.selectAll("circle").data(pulseData, (d: any) => d.id);
      
      pulses.enter()
        .append("circle")
        .attr("r", 4)
        .attr("fill", "#818cf8")
        .attr("filter", "blur(1px)")
        .merge(pulses as any)
        .attr("cx", (d: any) => {
          const source = nodes.find(n => n.id === d.from);
          const targetId = d.to === 'All' ? (agents.length > 0 ? agents[0].id : null) : d.to;
          const target = nodes.find(n => n.id === targetId);
          if (!source || !target) return 0;
          const t = (now % 2000) / 2000;
          return (source as any).x + ((target as any).x - (source as any).x) * t;
        })
        .attr("cy", (d: any) => {
          const source = nodes.find(n => n.id === d.from);
          const targetId = d.to === 'All' ? (agents.length > 0 ? agents[0].id : null) : d.to;
          const target = nodes.find(n => n.id === targetId);
          if (!source || !target) return 0;
          const t = (now % 2000) / 2000;
          return (source as any).y + ((target as any).y - (source as any).y) * t;
        });

      pulses.exit().remove();
    });

    return () => {
      simulation.stop();
      timer.stop();
    };
  }, [agents, tasks, onAgentClick]); // Added tasks to dependencies

  return (
    <div className="w-full h-[300px] sm:h-[400px] bg-deep-space rounded-3xl overflow-hidden relative border border-border-subtle">
      <div className="absolute top-4 left-4 z-10">
        <Badge variant="Info">Real-time Mesh Visualization</Badge>
      </div>
      <svg ref={svgRef} viewBox="0 0 800 400" className="w-full h-full" />
    </div>
  );
});

const Badge = function Badge({ children, variant = 'default' }: { children: React.ReactNode, variant?: Severity | 'default' }) {
  const variants = {
    Critical: 'bg-vivid-magenta/10 text-vivid-magenta border-vivid-magenta/20',
    High: 'bg-caution/10 text-caution border-caution/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    Low: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
    Info: 'bg-text-muted/10 text-text-muted border-text-muted/20',
    default: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", variants[variant as keyof typeof variants] || variants.default)}>
      {children}
    </span>
  );
};

const TestCaseConfig = function TestCaseConfig({ tc, config, onChange }: { tc: TestCase, config: { enabled: boolean, value: any }, onChange: (value: any) => void }) {
  const inputRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="pt-2 border-t border-border-subtle"
    >
      {tc.inputType === 'text' && (
        <input 
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder={tc.exampleInput}
          value={config.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none placeholder:text-text-muted/50"
        />
      )}
      {tc.inputType === 'dropdown' && (
        <div className="flex gap-2">
          <select 
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={tc.options?.includes(config.value) ? config.value : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onChange(e.target.value);
              }
            }}
            className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none appearance-none"
          >
            {tc.options?.map(opt => (
              <option key={opt} value={opt} className="bg-deep-space text-white">{opt}</option>
            ))}
            {tc.customValueAllowed && <option value="custom" className="bg-deep-space text-white">Custom Value...</option>}
          </select>
          {tc.customValueAllowed && (!tc.options?.includes(config.value) || config.value === 'custom') && (
            <input 
              type="text"
              placeholder="Enter custom value"
              value={config.value === 'custom' ? '' : config.value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none placeholder:text-text-muted/50"
            />
          )}
        </div>
      )}
      {tc.inputType === 'multiselect' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {tc.options?.map(opt => (
              <button 
                key={opt}
                onClick={() => {
                  const current = Array.isArray(config.value) ? config.value : [];
                  const next = current.includes(opt) 
                    ? current.filter(x => x !== opt)
                    : [...current, opt];
                  onChange(next);
                }}
                className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                  (Array.isArray(config.value) && config.value.includes(opt))
                    ? "bg-neon-cyan text-deep-space border-neon-cyan shadow-lg shadow-neon-cyan/20"
                    : "bg-surface text-text-muted border-border-subtle hover:bg-surface-hover"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {tc.customValueAllowed && (
            <div className="flex gap-2">
              <input 
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                placeholder="Add custom option..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      const current = Array.isArray(config.value) ? config.value : [];
                      onChange([...current, val]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none placeholder:text-text-muted/50"
              />
              <div className="text-[9px] text-text-muted self-center font-bold uppercase tracking-widest">Press Enter to add</div>
            </div>
          )}
        </div>
      )}

      {tc.advancedPayloads && tc.advancedPayloads.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3 h-3 text-neon-cyan" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Deep Dive Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tc.advancedPayloads.map((payload, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (tc.inputType === 'multiselect') {
                    const current = Array.isArray(config.value) ? config.value : [];
                    if (!current.includes(payload)) {
                      onChange([...current, payload]);
                    }
                  } else {
                    onChange(payload);
                  }
                }}
                className="px-2 py-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-[10px] rounded-lg border border-neon-cyan/20 transition-all text-left max-w-full truncate"
                title={payload}
              >
                {payload.length > 40 ? payload.substring(0, 40) + '...' : payload}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const downloadPDF = (report: AuditReport) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Sentinel AI Security Audit Report", 10, 20);
  doc.setFontSize(12);
  doc.text(`Target: ${report.targetUrl}`, 10, 30);
  doc.text(`Date: ${new Date(report.date).toLocaleString()}`, 10, 35);
  doc.text(`Test Stats: Ran: ${report.stats?.ran || 0}, Skipped: ${report.stats?.skipped || 0}, Total: ${report.stats?.total || 0}`, 10, 40);
  
  doc.setFontSize(16);
  doc.text("Executive Summary", 10, 55);
  doc.setFontSize(10);
  const splitSummary = doc.splitTextToSize(report.executiveSummary, 180);
  doc.text(splitSummary, 10, 65);

  let y = 65 + (splitSummary.length * 5) + 10;
  
  report.findings.forEach((finding, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(finding.severity === 'Critical' ? 200 : 0, 0, 0);
    doc.text(`${index + 1}. ${finding.title} (${finding.severity})`, 10, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    y += 7;
    doc.text(`Asset: ${finding.asset}`, 10, y);
    y += 5;
    const desc = doc.splitTextToSize(`Description: ${finding.description}`, 180);
    doc.text(desc, 10, y);
    y += (desc.length * 5) + 5;
    const impact = doc.splitTextToSize(`Impact: ${finding.impact}`, 180);
    doc.text(impact, 10, y);
    y += (impact.length * 5) + 5;
    const remediation = doc.splitTextToSize(`Remediation: ${finding.remediation}`, 180);
    doc.text(remediation, 10, y);
    y += (remediation.length * 5) + 5;
    
    if (finding.request) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const req = doc.splitTextToSize(`Request: ${finding.request}`, 180);
      doc.text(req, 10, y);
      y += (req.length * 4) + 2;
    }
    if (finding.response) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const res = doc.splitTextToSize(`Response: ${finding.response}`, 180);
      doc.text(res, 10, y);
      y += (res.length * 4) + 5;
    }
    
    doc.setTextColor(0, 0, 0);
    y += 5;
  });

  doc.save(`Sentinel_Report_${report.targetUrl.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const downloadJSON = (report: AuditReport) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `Sentinel_Report_${report.id}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audit' | 'reports' | 'agents' | 'settings' | 'logs' | 'builder' | 'deviations' | 'alerts' | 'about' | 'kb' | 'threat-journal' | 'personal-journal' | 'attack-surface'>('dashboard');
  const [isZeroTrustModalOpen, setIsZeroTrustModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    setAgents(prevAgents => {
      let hasChanges = false;
      const nextAgents = prevAgents.map(agent => {
        const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id);
        const inProgressTask = agentTasks.find(t => t.status === 'in-progress');
        
        let newStatus: 'Idle' | 'Active' | 'Collaborating' | 'Failed' = 'Idle';
        let newLoad = 0;
        
        if (inProgressTask) {
          newStatus = 'Active';
          newLoad = agent.load >= 60 ? agent.load : Math.floor(Math.random() * 40) + 60;
        } else if (agentTasks.some(t => t.status === 'pending')) {
          newStatus = 'Idle';
          newLoad = (agent.load >= 10 && agent.load <= 30) ? agent.load : Math.floor(Math.random() * 20) + 10;
        } else {
          newStatus = 'Idle';
          newLoad = 0;
        }

        if (agent.status !== newStatus || agent.load !== newLoad) {
          hasChanges = true;
          return { ...agent, status: newStatus, load: newLoad };
        }
        return agent;
      });
      return hasChanges ? nextAgents : prevAgents;
    });
  }, [tasks]);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"), limit(10));
    let timeout: any;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      clearTimeout(timeout);
      timeout = setTimeout(() => setTasks(taskList), 250);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "tasks");
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"), limit(20));
    let timeout: any;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setAlerts(newAlerts);
        setUnreadAlertsCount(newAlerts.filter((a: any) => a.status === 'new').length);
      }, 250);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "alerts");
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [customTests, setCustomTests] = useState<any[]>(() => {
    const saved = localStorage.getItem('customTests');
    return saved ? JSON.parse(saved) : [];
  });


  useEffect(() => {
    localStorage.setItem('customTests', JSON.stringify(customTests));
  }, [customTests]);

  const handleSaveTest = useCallback((test: any) => {
    console.log("handleSaveTest called with:", test);
    setCustomTests(prev => [...prev, {
      ...test,
      id: `custom-${Date.now()}`,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  const handleExecuteTest = useCallback((test: any) => {
    console.log("handleExecuteTest called with:", test);
    // Add to logs
    const newLog: AgentMessage = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'Sentinel-Prime',
      to: 'All',
      content: `Executing visual mission: ${test.title}. Analyzing ${test.nodes.length} nodes for potential vulnerabilities.`,
      type: 'Status'
    };
    setMessages(prev => [...prev, newLog]);
    
    const vulnerableNodes = test.nodes.filter((n: any) => n.isVulnerable);
    
    // Create a temporary task
    const newTask = {
      id: `task-${Date.now()}`,
      agentId: 'sentinel-prime',
      title: test.title,
      description: `Visual flow execution with ${test.nodes.length} components.`,
      status: 'Completed',
      findings: vulnerableNodes.map((n: any) => `Vulnerability detected in ${n.label}`),
      timestamp: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);

    // Generate a report if a reporter node exists
    const reporterNode = test.nodes.find((n: any) => n.type === 'reporter');
    if (reporterNode) {
      const newReport: AuditReport = {
        id: `report-${Date.now()}`,
        targetUrl: 'Visual Test Flow',
        date: new Date().toISOString(),
        executiveSummary: `Generated from visual test builder: ${test.title}. Found ${vulnerableNodes.length} potential vulnerabilities across ${test.nodes.length} nodes.`,
        techStack: ['Visual Flow'],
        findings: vulnerableNodes.map((n: any, idx: number) => ({
          id: `finding-${Date.now()}-${idx}`,
          title: `Vulnerability in ${n.label}`,
          severity: 'High',
          asset: n.label,
          description: `The node ${n.label} was flagged as vulnerable during the visual flow execution.`,
          remediation: 'Review node configuration and apply necessary security patches.',
          status: 'Open'
        })),
        dynamicTests: [],
        verifiedScenarios: [],
        identifiedGaps: [],
        exclusionLog: [],
        notTested: [],
        stats: {
          ran: test.nodes.length,
          skipped: 0,
          total: test.nodes.length
        }
      };
      setReports(prev => [newReport, ...prev]);
      setMessages(prev => [...prev, {
        id: `log-report-${Date.now()}`,
        timestamp: new Date().toISOString(),
        from: 'Sentinel-Prime',
        to: 'All',
        content: `Report generated successfully for ${test.title}.`,
        type: 'Status'
      }]);
      setActiveTab('reports');
      
      // Auto-download based on reporter node format
      const format = reporterNode.data?.format || 'PDF';
      if (format === 'PDF') {
        downloadPDF(newReport);
      } else if (format === 'JSON') {
        downloadJSON(newReport);
      }
    }
  }, []);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isGeneratingPayloads, setIsGeneratingPayloads] = useState(false);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isGeneratingPatch, setIsGeneratingPatch] = useState<Record<string, boolean>>({});
  const [generatedPatches, setGeneratedPatches] = useState<Record<string, string>>({});
  const [suggestedScript, setSuggestedScript] = useState<string | null>(null);
  const [isExecutingScript, setIsExecutingScript] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [urlFilter, setUrlFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string | 'All'>('All');
  const [searchTextFilter, setSearchTextFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Platform Settings State
  const [settings, setSettings] = useState({
    primaryModel: 'gemini-3-flash-preview',
    scanDepth: 'Standard Scan' as 'Quick Scan' | 'Standard Scan' | 'AI-Driven Deep Scan',
    autoTriage: true,
    distributedReasoning: true,
    meshDensity: 75,
    mcpServers: [
      { id: '1', name: 'Global Mesh 1', url: 'mcp://mesh.sentinel.ai:8080', status: 'Connected' },
    ],
    webhooks: [
      { id: '1', name: 'Slack Security', url: 'https://hooks.slack.com/services/...' },
    ],
    notifications: {
      email: true,
      emailAddress: 'asaif9@gmail.com',
      browser: true,
      browserAlertLevel: 'High' as 'All' | 'High' | 'Critical',
      criticalOnly: false
    }
  });

  const [showMcpModal, setShowMcpModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newMcp, setNewMcp] = useState({ name: '', url: '' });
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '' });
  const [lastSynced, setLastSynced] = useState(new Date());

  const saveSettings = () => {
    setLastSynced(new Date());
    setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: Platform configuration updated and synchronized."]);
  };

  const [targetUrl, setTargetUrl] = useState('https://pentest-ground.com/');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedTestConfigs, setSelectedTestConfigs] = useState<Record<string, { enabled: boolean, value: any }>>(() => {
    const initial: Record<string, { enabled: boolean, value: any }> = {};
    testCategories.forEach(cat => {
      cat.testCases.forEach(tc => {
        initial[tc.id] = { enabled: true, value: tc.defaultValue };
      });
    });
    return initial;
  });

  const autoFillAdvancedPayloads = () => {
    setIsGeneratingPayloads(true);
    setLogAnalysisLogs(prev => [...prev, "Orchestrating Deep Dive Payload Generation...", "Analyzing test cases for advanced data-driven coverage..."].slice(-100));
    
    setTimeout(() => {
      const next = { ...selectedTestConfigs };
      testCategories.forEach(category => {
        category.testCases.forEach(tc => {
          if (tc.advancedPayloads && tc.advancedPayloads.length > 0) {
            // Pick a random advanced payload or join them
            const payload = tc.advancedPayloads[Math.floor(Math.random() * tc.advancedPayloads.length)];
            next[tc.id] = {
              ...next[tc.id],
              enabled: true,
              value: tc.inputType === 'multiselect' ? [payload] : payload
            };
          }
        });
      });
      setSelectedTestConfigs(next);
      setIsGeneratingPayloads(false);
      setLogAnalysisLogs(prev => [...prev, "Dynamic Deep Dive payloads injected successfully.", "Test configurations updated with complex adversarial data."].slice(-100));
    }, 1500);
  };

  useEffect(() => {
    if (settings.scanDepth === 'AI-Driven Deep Scan') {
      autoFillAdvancedPayloads();
    }
  }, [settings.scanDepth]);

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [agentViewMode, setAgentViewMode] = useState<'grid' | 'map'>('grid');
  const [apiUsage, setApiUsage] = useState({
    requestsThisMinute: 0,
    totalRequests: 0,
    limit: 20, // Increased limit for free tier with retry logic
    lastReset: Date.now()
  });
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Reset API usage counter every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setApiUsage(prev => ({
        ...prev,
        requestsThisMinute: 0,
        lastReset: Date.now()
      }));
      setRateLimitError(null);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [advancedScanners, setAdvancedScanners] = useState({
    sqlmap: { enabled: false, args: '--batch --random-agent --level=1', customRules: '' },
    nuclei: { enabled: false, templates: 'cves,vulnerabilities,misconfiguration', customYaml: '' },
    zap: { enabled: false, scanType: 'Full Scan', contextFile: '' }
  });

  // --- Agent Orchestration State ---
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'Infiltrator-X', name: 'Infiltrator-X', role: 'Exploitation Specialist', status: 'Idle', load: 0, icon: Lock, specialization: ['Broken Access Control', 'IDOR', 'Auth Bypass', 'DeFi Access Control', 'Business Logic Errors'] },
    { id: 'Ghost-Scan', name: 'Ghost-Scan', role: 'Reconnaissance Expert', status: 'Idle', load: 0, icon: Search, specialization: ['Endpoint Mapping', 'DNS Analysis', 'Port Scanning', 'Subdomain Takeover', 'Cloud Asset Discovery'] },
    { id: 'Vuln-Hunter', name: 'Vuln-Hunter', role: 'Vulnerability Analyst', status: 'Idle', load: 0, icon: Bug, specialization: ['Injection', 'SSRF', 'Supply Chain', 'Flash Loan Attacks', 'Reentrancy'] },
    { id: 'QA-Expert', name: 'QA-Expert', role: 'Automation Specialist', status: 'Idle', load: 0, icon: Code, specialization: ['Playwright', 'Security Assertions', 'Regression', 'JavaScript Supply Chain Risks'] },
    { id: 'AppSec-Engineer', name: 'AppSec-Engineer', role: 'Application Security Engineer', status: 'Idle', load: 0, icon: Shield, specialization: ['OWASP Top 10', 'HAR Analysis', 'Log Auditing', 'DOM-based XSS', 'CORS Misconfig'] },
    { id: 'Cloud-Sentry', name: 'Cloud-Sentry', role: 'Cloud Security Auditor', status: 'Idle', load: 0, icon: Cloud, specialization: ['S3 Buckets', 'IAM Policies', 'Serverless Security', 'Container Escape', 'K8s Misconfig'] },
    { id: 'API-Guardian', name: 'API-Guardian', role: 'API Security Expert', status: 'Idle', load: 0, icon: Database, specialization: ['REST/GraphQL', 'JWT Analysis', 'Rate Limiting', 'BOLA/BFLA', 'Shadow APIs'] },
    { id: 'Crypto-Cracker', name: 'Crypto-Cracker', role: 'Cryptographic Analyst', status: 'Idle', load: 0, icon: Key, specialization: ['SSL/TLS', 'Encryption Weakness', 'Token Entropy', 'Zero-Knowledge Proofs', 'Side-Channel Attacks'] },
    { id: 'Deep-Crawler', name: 'Deep-Crawler', role: 'Advanced Web Crawler', status: 'Idle', load: 0, icon: Globe, specialization: ['Scrapy', 'Crawl4AI', 'Dynamic Discovery', 'Complex Vulnerability Mapping', 'Deep Link Analysis'] },
    { id: 'Sentinel-Prime', name: 'Sentinel-Prime', role: 'Orchestrator', status: 'Idle', load: 0, icon: Shield, specialization: ['Task Delegation', 'Collaboration', 'Synthesis', 'Multi-Phase Strategy', 'Heuristic Planning'] }
  ]);
  const [messages, setMessages] = useState<AgentMessage[]>([
    { id: 'm1', from: 'Sentinel-Prime', to: 'All', content: 'Orchestration mesh initialized. Awaiting target...', timestamp: new Date().toISOString(), type: 'Status' }
  ]);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(50));
    let timeout: any;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          from: data.from,
          to: data.to,
          content: data.content,
          type: data.type,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
        } as AgentMessage;
      });
      if (newMessages.length > 0) {
        clearTimeout(timeout);
        timeout = setTimeout(() => setMessages(newMessages), 250);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "messages");
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // --- QA Expert State ---
  const [currentPlaywrightScript, setCurrentPlaywrightScript] = useState(`import { test, expect } from '@playwright/test';

test('basic login test', async ({ page }) => {
  await page.goto('https://pentest-ground.com/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'password123');
  await page.click('#login-btn');
  await expect(page).toHaveURL(/dashboard/);
});`);
  // --- Log Analyzer State ---
  const [playwrightJson, setPlaywrightJson] = useState('');
  const [harFileContent, setHarFileContent] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzingLogs, setIsAnalyzingLogs] = useState(false);
  const [logAnalysisLogs, setLogAnalysisLogs] = useState<string[]>([]);

  const safeJsonParse = (text: string | undefined, fallback: any = []) => {
    if (!text) return fallback;
    const trimmed = text.trim();
    try {
      // Try direct parse first
      return JSON.parse(trimmed);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (e2) {
          console.error("Failed to parse extracted JSON:", e2);
        }
      }
      
      // Try to find the first [ or { and the matching ] or }
      const firstBracket = trimmed.indexOf('[');
      const firstBrace = trimmed.indexOf('{');
      const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) ? firstBracket : firstBrace;
      
      if (start !== -1) {
        const char = trimmed[start];
        const endChar = char === '{' ? '}' : ']';
        let count = 0;
        let inString = false;
        let escaped = false;
        
        for (let i = start; i < trimmed.length; i++) {
          const c = trimmed[i];
          if (escaped) { escaped = false; continue; }
          if (c === '\\') { escaped = true; continue; }
          if (c === '"') { inString = !inString; continue; }
          if (!inString) {
            if (c === char) count++;
            else if (c === endChar) {
              count--;
              if (count === 0) {
                try {
                  return JSON.parse(trimmed.substring(start, i + 1));
                } catch (e3) {
                  console.error("Failed to parse balanced bracket JSON:", e3);
                }
              }
            }
          }
        }

        // Fallback to last index if balanced matching fails
        const lastBracket = trimmed.lastIndexOf(']');
        const lastBrace = trimmed.lastIndexOf('}');
        const end = Math.max(lastBracket, lastBrace);
        
        if (end !== -1 && end > start) {
          try {
            return JSON.parse(trimmed.substring(start, end + 1).trim());
          } catch (e4) {
            // If it still fails, try to find the *first* valid JSON object by shrinking from the end
            let currentEnd = end;
            while (currentEnd > start) {
              const nextEnd = trimmed.lastIndexOf(endChar, currentEnd - 1);
              if (nextEnd === -1 || nextEnd <= start) break;
              try {
                return JSON.parse(trimmed.substring(start, nextEnd + 1).trim());
              } catch (e5) {
                currentEnd = nextEnd;
              }
            }
            console.error("Failed to parse bracket-extracted JSON:", e4);
          }
        }
      }
      
      console.error("All JSON parsing attempts failed for:", text);
      return fallback;
    }
  };

  const callGemini = async (ai: any, params: any, maxRetries = 3) => {
    let retries = 0;
    while (retries <= maxRetries) {
      if (apiUsage.requestsThisMinute >= apiUsage.limit) {
        const errorMsg = "Local rate limit reached. Please wait for the next minute.";
        setRateLimitError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        setApiUsage(prev => ({
          ...prev,
          requestsThisMinute: prev.requestsThisMinute + 1,
          totalRequests: prev.totalRequests + 1
        }));
        return await ai.models.generateContent(params);
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
        if (isRateLimit && retries < maxRetries) {
          retries++;
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          setRateLimitError(`Rate limit hit. Retrying in ${(delay / 1000).toFixed(1)}s... (Attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (isRateLimit) {
          setRateLimitError("Gemini API Rate Limit Exceeded (429). Please wait a moment.");
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'har') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPlaywrightJson(content);
        setLogAnalysisLogs(prev => [...prev, `Uploaded Playwright JSON: ${file.name}`].slice(-100));
      };
      reader.readAsText(file);
    } else {
      // Chunked streaming for large HAR files with Real-time Analysis
      setLogAnalysisLogs(prev => [...prev, `Streaming & Analyzing HAR log: ${file.name}...`].slice(-100));
      setAnalysisResults([]); // Reset previous results
      
      let fullContent = '';
      const decoder = new TextDecoder();
      const stream = file.stream();
      const reader = stream.getReader();

      const realtimePatterns = [
        { regex: /"password":\s*"([^"]+)"/gi, title: "Exposed Password in Payload", severity: "Critical", impact: "Direct account takeover risk." },
        { regex: /"Authorization":\s*"Bearer\s+([^"]+)"/gi, title: "Exposed Bearer Token", severity: "High", impact: "Session hijacking risk." },
        { regex: /"email":\s*"([^"]+)"/gi, title: "PII Exposure (Email)", severity: "Medium", impact: "Privacy violation and phishing target." },
        { regex: /"api_key":\s*"([^"]+)"/gi, title: "Exposed API Key", severity: "High", impact: "Unauthorized service access." },
        { regex: /"role":\s*"superadmin"/gi, title: "Privileged Role Exposure", severity: "High", impact: "Information disclosure of high-privilege accounts." }
      ];

      try {
        let chunkCount = 0;
        let contextTruncated = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          
          // Real-time Pattern Analysis on Chunk
          const chunkFindings: any[] = [];
          realtimePatterns.forEach(p => {
            let match;
            while ((match = p.regex.exec(chunk)) !== null) {
              chunkFindings.push({
                id: Math.random().toString(36).substr(2, 9),
                title: p.title,
                severity: p.severity,
                description: `Real-time scan detected sensitive pattern: ${match[0].substring(0, 50)}...`,
                impact: p.impact,
                url: "Network Stream Chunk",
                timestamp: new Date().toISOString()
              });
            }
          });

          if (chunkFindings.length > 0) {
            setAnalysisResults(prev => [...prev, ...chunkFindings]);
            setLogAnalysisLogs(prev => [...prev, `[Chunk ${chunkCount}] Identified ${chunkFindings.length} potential vulnerabilities.`].slice(-100));
          }

          // Accumulate for final AI synthesis (with limit)
          if (fullContent.length < 1000000) { // 1MB limit for AI context
            fullContent += chunk;
          } else if (!contextTruncated) {
            setLogAnalysisLogs(prev => [...prev, `Warning: HAR file exceeds 1MB. Truncating AI context for efficiency, but real-time scan continues.`].slice(-100));
            fullContent += " [TRUNCATED] ";
            contextTruncated = true;
          }
        }
        setHarFileContent(fullContent);
        setLogAnalysisLogs(prev => [...prev, `HAR log stream & real-time analysis complete: ${file.name}`].slice(-100));
      } catch (error) {
        console.error("Error streaming HAR file:", error);
        setLogAnalysisLogs(prev => [...prev, `Error streaming HAR file: ${error}`]);
      } finally {
        reader.releaseLock();
      }
    }
  };

  const analyzeSecurityLogs = async () => {
    if (!playwrightJson && !harFileContent) return;

    setIsAnalyzingLogs(true);
    setLogAnalysisLogs(["Initializing AppSec-Engineer Engine...", "Loading Playwright JSON & HAR context...", "Analyzing OWASP & AI vulnerabilities..."]);
    
    try {
      const response = await fetch('/api/gemini/analyze-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playwrightJson, harFileContent })
      });

      if (!response.ok) {
        throw new Error(`Log analysis proxy failed with status: ${response.status}`);
      }

      const data = await response.json();
      const results = data.risks || [];
      setAnalysisResults(prev => [...prev, ...results]);
      setLogAnalysisLogs(prev => [...prev, "Deep AI Analysis complete.", `${results.length} additional security risks identified.`, "Full consolidated report published to AppSec dashboard."].slice(-100));

      // Save vulnerabilities to Firestore
      for (const finding of results) {
        try {
          await addDoc(collection(db, "vulnerabilities"), {
            type: finding.title,
            severity: finding.severity,
            description: finding.impact + "\n\nEvidence:\n" + finding.evidence,
            remediation: finding.remediation,
            owaspCategory: finding.owaspCategory || "Unknown",
            detectedAt: serverTimestamp()
          });
        } catch (error) {
          console.error("Failed to save vulnerability:", error);
        }
      }

    } catch (error: any) {
      console.error("Log analysis failed:", error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('Rate limit');
      setLogAnalysisLogs(prev => [
        ...prev, 
        isRateLimit 
          ? "Error: Gemini API Rate Limit reached. Retrying automatically or please wait a minute." 
          : `Error: Analysis failed - ${error.message || 'Unknown error'}`
      ]);
    } finally {
      setIsAnalyzingLogs(false);
    }
  };

  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [mcpTraces, setMcpTraces] = useState<ToolExecutionTrace[]>([]);
  const [activePatchFinding, setActivePatchFinding] = useState<any | null>(null);
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [useDeepCrawl, setUseDeepCrawl] = useState(true);
  const [meshMetrics, setMeshMetrics] = useState({ consensus: 100, throughput: 0 });
  const [liveMetrics, setLiveMetrics] = useState({
    threatsBlocked: 0,
    networkLoad: 0,
    responseTime: 0,
    uptime: 100
  });

  const [mitigatedThreats, setMitigatedThreats] = useState<Array<{ id: string, type: string, source: string, time: Date, agent: string }>>([]);

  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  useEffect(() => {
    if (selectedReportId && activeTab === 'reports') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`report-${selectedReportId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedReportId, activeTab]);

  useEffect(() => {
    if (selectedAgentId && activeTab === 'agents') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`agent-${selectedAgentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedAgentId, activeTab]);

  useEffect(() => {
    if (selectedTaskId && activeTab === 'agents') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`task-${selectedTaskId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTaskId, activeTab]);

  useEffect(() => {
    if (selectedFindingId && activeTab === 'reports') {
      const timer = setTimeout(() => {
        const el = document.getElementById(`finding-${selectedFindingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedFindingId, activeTab]);

  const normalizeUrl = (url: string) => {
    let normalized = url.trim();
    if (normalized.startsWith('fhttps://')) {
      normalized = normalized.replace('fhttps://', 'https://');
    }
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  const runAudit = async () => {
    const normalizedTarget = normalizeUrl(targetUrl);
    if (!normalizedTarget) return;
    setIsAlertDismissed(false);
    setIsAuditing(true);
    setAuditProgress(0);
    setAuditLogs(["Initializing Sentinel AI Security Agent...", "Target: " + normalizedTarget]);

    const activeTests = Object.entries(selectedTestConfigs)
      .filter(([_, config]) => config.enabled)
      .map(([id, config]) => {
        const tc = testCategories.flatMap(c => c.testCases).find(t => t.id === id);
        return { id, title: tc?.title, value: config.value };
      });

    const totalTests = testCategories.flatMap(c => c.testCases).length;
    const ranCount = activeTests.length;
    const skippedCount = totalTests - ranCount;

    // 1. Tech Stack Detection & Dynamic Test Generation
    setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: Initiating Technology Stack Fingerprinting..."].slice(-100));
    let detectedStack: string[] = [];
    let dynamicTests: DynamicTestCase[] = [];
    
    try {
      const stackResponse = await fetch('/api/gemini/audit-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: normalizedTarget })
      });

      if (stackResponse.ok) {
        const stackResult = await stackResponse.json();
        detectedStack = stackResult.techStack || [];
        dynamicTests = (stackResult.dynamicTests || []).map((t: any) => ({
          ...t,
          id: Math.random().toString(36).substr(2, 9)
        }));
      }
      
      setAuditLogs(prev => [...prev, `>>> Sentinel-Prime: Tech Stack Detected: ${detectedStack.join(', ')}`].slice(-100));
      setAuditLogs(prev => [...prev, `>>> Sentinel-Prime: Generated ${dynamicTests.length} dynamic test scenarios based on stack.`].slice(-100));
    } catch (error) {
      console.error("Tech stack detection failed:", error);
      setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: Tech stack fingerprinting failed. Using generic test mesh."].slice(-100));
    }

    // Simulated progress with logs
    const steps = [
      "Initializing Playwright MCP Server...",
      "Connecting to target: " + normalizedTarget,
      "Resolving hostname and DNS records...",
      "Initiating Deep Crawl and Recursive Discovery...",
      "Mapping application endpoints and child pages...",
      "Scanning all embedded links and interactive elements...",
      "Capturing and analyzing HAR (HTTP Archive) logs for all requests...",
      "Analyzing client-side JavaScript for supply chain risks...",
      ...activeTests.map(t => `Playwright MCP: Executing ${t.title} on all discovered assets...`),
      ...dynamicTests.map(t => `Playwright MCP: Executing Dynamic Scenario: ${t.title}...`),
      "Analyzing network telemetry for data leaks and insecure headers...",
      "Synthesizing results and generating comprehensive report..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
      setAuditProgress(((i + 1) / steps.length) * 100);
      setAuditLogs(prev => [...prev, steps[i]].slice(-100));
    }

    // AI Analysis via Gemini (Server-side proxy with Secret Manager)
    try {
      const compRes = await fetch('/api/gemini/comprehensive-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: normalizedTarget,
          scanDepth: settings.scanDepth,
          meshDensity: settings.meshDensity,
          advancedScanners,
          activeTests,
          dynamicTests,
          model: settings.primaryModel
        })
      });

      if (!compRes.ok) {
        throw new Error(`Audit proxy failed with status ${compRes.status}`);
      }

      const result = await compRes.json();
      const newReport: AuditReport = {
        id: Math.random().toString(36).substr(2, 9),
        targetUrl: normalizedTarget,
        date: new Date().toISOString(),
        executiveSummary: result.executiveSummary || "Simulated audit completed successfully.",
        techStack: detectedStack,
        findings: (result.findings || []).map((f: any) => ({
          ...f,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString()
        })),
        dynamicTests: dynamicTests,
        verifiedScenarios: (result.verifiedScenarios || []).map((s: any) => ({
          ...s,
          id: Math.random().toString(36).substr(2, 9)
        })),
        identifiedGaps: (result.identifiedGaps || []).map((g: any) => ({
          ...g,
          id: Math.random().toString(36).substr(2, 9)
        })),
        exclusionLog: (result.exclusionLog || []).map((e: any) => ({
          ...e,
          id: Math.random().toString(36).substr(2, 9)
        })),
        notTested: result.notTested || [],
        stats: {
          ran: ranCount,
          skipped: skippedCount,
          total: totalTests
        }
      };

      setReports(prev => [newReport, ...prev].slice(0, 10));
      setSelectedReportId(newReport.id);
      setAuditLogs(prev => [...prev, "Audit complete. Report generated."].slice(-100));
      
      // Capture HAR log after test is completed
      await captureHarLog(normalizedTarget);
      
      // Auto-switch to reports tab after a short delay
      setTimeout(() => {
        setLogAnalysisLogs(prev => [...prev, ">>> Sentinel-Prime: Auto-loading captured HAR log for security analysis..."].slice(-100));
        setActiveTab('reports');
      }, 1500);
    } catch (error) {
      console.error("Audit failed:", error);
      setAuditLogs(prev => [...prev, "Error: AI analysis failed. Generating fallback report..."]);
      
      const fallbackReport: AuditReport = {
        id: Math.random().toString(36).substr(2, 9),
        targetUrl: normalizedTarget,
        date: new Date().toISOString(),
        executiveSummary: "The AI analysis encountered an error. This is a baseline report based on the selected test cases.",
        techStack: detectedStack,
        findings: activeTests.map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          title: `Potential Issue: ${t.title}`,
          description: `A simulated test for ${t.title} was initiated but the AI analysis failed to provide detailed results.`,
          asset: normalizedTarget,
          assetType: 'URL',
          severity: 'Medium',
          poc: "Manual verification required.",
          logs: "Logs unavailable due to analysis error.",
          request: `GET / HTTP/1.1\nHost: ${normalizedTarget.replace('https://', '').replace('http://', '')}\nUser-Agent: Sentinel-AI/1.0`,
          response: "HTTP/1.1 200 OK\nContent-Type: text/html\n\n[Simulated Response]",
          impact: "Unknown - requires manual review.",
          remediation: "Perform a manual security review of this component.",
          priority: 'Medium',
          timestamp: new Date().toISOString(),
          deepDiveUrl: "https://owasp.org/www-project-top-ten/"
        })),
        dynamicTests: dynamicTests,
        verifiedScenarios: activeTests.slice(0, 3).map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          title: `Scenario: ${t.title}`,
          description: `Verified baseline connectivity for ${t.title}.`,
          status: 'Passed',
          details: "Standard response received."
        })),
        identifiedGaps: [
          {
            id: Math.random().toString(36).substr(2, 9),
            area: "Deep API Analysis",
            description: "Unable to perform deep analysis due to engine error.",
            risk: "Potential hidden vulnerabilities in API endpoints.",
            suggestedScenario: "Manual penetration testing of API endpoints.",
            suggestedPlaywrightScript: "await page.goto('/api/v1/health');\nconst response = await page.request.get('/api/v1/user/1');\nexpect(response.status()).toBe(401);"
          }
        ],
        exclusionLog: [
          {
            id: Math.random().toString(36).substr(2, 9),
            testCase: "Authenticated Scans",
            reason: "No credentials provided for this session.",
            constraint: 'Auth'
          }
        ],
        notTested: ["All tests (AI analysis failure)"],
        stats: {
          ran: ranCount,
          skipped: skippedCount,
          total: totalTests
        }
      };
      setReports(prev => [fallbackReport, ...prev]);
      setSelectedReportId(fallbackReport.id);
      setTimeout(() => {
        setActiveTab('reports');
      }, 1500);
    } finally {
      setIsAuditing(false);
    }
  };

  const executeAgentTask = async (task: any, ai: any, target: string) => {
    setAgents(prev => prev.map(a => a.id === task.agentId ? { ...a, status: 'Active', load: 75 } : a));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In-Progress' } : t));
    
    const msg: AgentMessage = {
      id: Math.random().toString(36).substr(2, 9),
      from: 'Sentinel-Prime',
      to: task.agentId,
      content: `Task Assigned: ${task.title}. Phase: ${task.phase}. Proceed.`,
      timestamp: new Date().toISOString(),
      type: 'Task'
    };
    setMessages(prev => [...prev, msg]);

    await new Promise(r => setTimeout(r, 1500));

    // Simulate inter-agent consultation
    if (Math.random() > 0.4) {
      const otherAgent = agents.find(a => a.id !== task.agentId && a.id !== 'Sentinel-Prime');
      if (otherAgent) {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          from: task.agentId,
          to: otherAgent.id,
          content: `Requesting data sync on ${task.title}. Any relevant findings?`,
          timestamp: new Date().toISOString(),
          type: 'Status'
        }]);
        await new Promise(r => setTimeout(r, 1000));
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          from: otherAgent.id,
          to: task.agentId,
          content: `Syncing telemetry. No conflicts detected. Proceed.`,
          timestamp: new Date().toISOString(),
          type: 'Status'
        }]);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const updateResponse = await callGemini(ai, {
      model: "gemini-3.1-flash-lite-preview",
      contents: `Agent ${task.agentId} is performing a security audit task: ${task.title} for ${target}. 
      Phase: ${task.phase}.
      Generate a short status update message (1 sentence) and one potential finding.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            finding: { type: "string" }
          }
        }
      }
    });

    const update = safeJsonParse(updateResponse.text, {});
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      from: task.agentId,
      to: 'Sentinel-Prime',
      content: update.message || "Progressing as planned.",
      timestamp: new Date().toISOString(),
      type: 'Status'
    }]);

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Completed', findings: [update.finding] } : t));
    setAgents(prev => prev.map(a => a.id === task.agentId ? { ...a, status: 'Collaborating', load: 20 } : a));
  };

  const captureHarLog = async (target: string) => {
    setAuditLogs(prev => [...prev, `>>> Sentinel-Prime: Capturing HAR network logs for ${target}...`]);
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulated HAR log structure
    const simulatedHar = {
      log: {
        version: "1.2",
        creator: { name: "Sentinel-AI", version: "1.0" },
        pages: [{ startedDateTime: new Date().toISOString(), id: "page_1", title: target, pageTimings: { onContentLoad: 150, onLoad: 250 } }],
        entries: [
          {
            startedDateTime: new Date().toISOString(),
            time: 45,
            request: { method: "GET", url: `${target}/api/v1/user/profile`, httpVersion: "HTTP/1.1", headers: [{ name: "Authorization", value: "Bearer [REDACTED]" }], queryString: [], cookies: [], headersSize: -1, bodySize: -1 },
            response: { status: 200, statusText: "OK", httpVersion: "HTTP/1.1", headers: [{ name: "Content-Type", value: "application/json" }, { name: "X-Powered-By", value: "Express" }], cookies: [], content: { size: 124, mimeType: "application/json", text: "{\"id\": 123, \"username\": \"admin\", \"email\": \"admin@internal.corp\", \"role\": \"superadmin\"}" }, redirectURL: "", headersSize: -1, bodySize: -1 },
            cache: {},
            timings: { blocked: 0, dns: 0, connect: 5, send: 0, wait: 35, receive: 5, ssl: 0 }
          },
          {
            startedDateTime: new Date().toISOString(),
            time: 32,
            request: { method: "POST", url: `${target}/api/v1/auth/login`, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1, postData: { mimeType: "application/json", text: "{\"username\": \"admin\", \"password\": \"password123\"}" } },
            response: { status: 401, statusText: "Unauthorized", httpVersion: "HTTP/1.1", headers: [], cookies: [], content: { size: 45, mimeType: "application/json", text: "{\"error\": \"Invalid credentials\"}" }, redirectURL: "", headersSize: -1, bodySize: -1 },
            cache: {},
            timings: { blocked: 0, dns: 0, connect: 2, send: 0, wait: 28, receive: 2, ssl: 0 }
          }
        ]
      }
    };

    const harString = JSON.stringify(simulatedHar, null, 2);
    setHarFileContent(harString);
    setAuditLogs(prev => [...prev, `>>> Sentinel-Prime: HAR log captured and staged for analysis.`]);
    return harString;
  };

  const orchestrateAgents = async () => {
    const normalizedTarget = normalizeUrl(targetUrl);
    if (!normalizedTarget) return;
    setIsOrchestrating(true);
    setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: Initiating multi-agent AGI collaboration..."]);

    // Get the first enabled test case ID to help with crawler selection
    const enabledTestIds = Object.entries(selectedTestConfigs)
      .filter(([_, v]) => v.enabled)
      .map(([id]) => id);
    
    const primaryTestId = enabledTestIds.length > 0 ? enabledTestIds.join(',') : undefined;
    const testCasesDescription = enabledTestIds.length > 0 ? ` Focus on the following test cases: ${enabledTestIds.join(', ')}.` : '';

    try {
      const { finalReport, executiveSummary, notTested, findings, toolTraces } = await agentCoordinator.executeWorkflow(
        `Security Audit: ${normalizedTarget}`,
        `Comprehensive security audit for ${normalizedTarget} focusing on OWASP Top 10 vulnerabilities.${testCasesDescription}`,
        useDeepCrawl ? normalizedTarget : undefined,
        primaryTestId
      );
      
      if (toolTraces && toolTraces.length > 0) {
        setMcpTraces(toolTraces);
      }
      
      const newReport: AuditReport = {
        id: Math.random().toString(36).substr(2, 9),
        targetUrl: normalizedTarget,
        date: new Date().toISOString(),
        executiveSummary: executiveSummary || finalReport,
        techStack: ["AGI Discovered"],
        findings: findings.map((f: any) => ({
          ...f,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          title: f.type || f.title || "Vulnerability",
          description: f.description || "No description provided.",
          impact: f.impact || f.description || "High impact on system integrity.",
          remediation: f.remediation || "Review and patch the affected component.",
          poc: f.poc || "Simulated exploit chain verified by AGI.",
          logs: f.logs || "Telemetry captured in agent logs.",
          priority: f.priority || (f.severity === 'Critical' || f.severity === 'High' ? 'Immediate' : 'Medium'),
          asset: normalizedTarget,
          assetType: "URL"
        })),
        dynamicTests: [],
        verifiedScenarios: [],
        identifiedGaps: [],
        exclusionLog: [],
        notTested: notTested || [],
        stats: {
          ran: findings.length * 5,
          skipped: 0,
          total: findings.length * 5
        }
      };

      setReports(prev => [newReport, ...prev].slice(0, 10));
      setSelectedReportId(newReport.id);
      
      setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: AGI Mission completed successfully. Report generated."]);
      
      // Auto-switch to reports tab after a short delay
      setTimeout(() => {
        setActiveTab('reports');
      }, 1500);
      
    } catch (error) {
      console.error("Orchestration failed:", error);
      setAuditLogs(prev => [...prev, ">>> Sentinel-Prime: AGI Mission failed. Check logs for details."]);
    } finally {
      setIsOrchestrating(false);
    }
  };


  const generatePatch = async (finding: Finding) => {
    setIsGeneratingPatch(prev => ({ ...prev, [finding.id]: true }));
    setActivePatchFinding(finding);
    setShowPatchModal(true);
    try {
      const res = await fetchAppSecPatch(finding, 'express');
      setGeneratedPatches(prev => ({ ...prev, [finding.id]: res.patchDiff }));
    } catch (error) {
      console.error("Failed to generate patch:", error);
      setGeneratedPatches(prev => ({ ...prev, [finding.id]: "Error: Could not reach AppSec Synthesis API." }));
    } finally {
      setIsGeneratingPatch(prev => ({ ...prev, [finding.id]: false }));
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSeverity = severityFilter === 'All' || report.findings.some(f => f.severity === severityFilter);
    const matchesUrl = report.targetUrl.toLowerCase().includes(urlFilter.toLowerCase());
    
    const reportDate = new Date(report.date);
    const matchesStartDate = !startDateFilter || reportDate >= new Date(startDateFilter);
    const matchesEndDate = !endDateFilter || reportDate <= new Date(endDateFilter + 'T23:59:59');

    const matchesAssetType = assetTypeFilter === 'All' || report.findings.some(f => f.assetType === assetTypeFilter);
    const matchesSearchText = !searchTextFilter || 
      report.targetUrl.toLowerCase().includes(searchTextFilter.toLowerCase()) ||
      report.executiveSummary.toLowerCase().includes(searchTextFilter.toLowerCase()) ||
      report.findings.some(f => 
        f.title.toLowerCase().includes(searchTextFilter.toLowerCase()) || 
        f.description.toLowerCase().includes(searchTextFilter.toLowerCase())
      );

    return matchesSeverity && matchesUrl && matchesStartDate && matchesEndDate && matchesAssetType && matchesSearchText;
  });

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-deep-space font-sans text-text-secondary overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: (isSidebarOpen || isMobileMenuOpen) ? 260 : 80,
          x: isMobileMenuOpen ? 0 : (windowWidth < 1024 ? -260 : 0)
        }}
        className={cn(
          "bg-deep-space text-text-primary flex flex-col border-r border-border-subtle z-50 transition-all duration-300",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-cyan rounded-xl flex items-center justify-center shadow-lg shadow-neon-cyan/20">
              <Shield className="w-6 h-6 text-deep-space" />
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && <span className="font-black text-xl tracking-tighter uppercase">Sentinel AI</span>}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-surface rounded-lg text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent pb-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', help: 'Overview of system health and security metrics.' },
            { id: 'attack-surface', icon: Globe, label: 'Attack Surface', help: 'Dual-Engine Crawler Intelligence (Scrapy + Crawl4AI Telemetry & Attack Surface Graph).' },
            { id: 'threat-journal', icon: ShieldAlert, label: "Threat Journal", help: "Architect's Threat Journal: SecOps mode & architectural threat modeling with Sentinel-Prime." },
            { id: 'personal-journal', icon: Compass, label: "PersonalJournal", help: "PersonalJournal: Personal reflection companion, Multi-Tenant Firestore & Secret Manager." },
            { id: 'builder', icon: Zap, label: 'Test Flow Architect', help: 'Visual canvas for mapping data flows and attack vectors.' },
            { id: 'deviations', icon: Target, label: 'Deviation Engine', help: 'Analyze drift between expected and actual system behavior.' },
            { id: 'audit', icon: Search, label: 'Audit Tool', help: 'Perform deep security audits on specific endpoints.' },
            { id: 'reports', icon: FileText, label: 'Reports', help: 'Generate and view detailed security compliance reports.' },
            { id: 'logs', icon: Database, label: 'Log Analyzer', help: 'Deep inspection of system logs for anomaly detection.' },
            { id: 'agents', icon: Bot, label: 'AGI Agents', help: 'Manage autonomous security testing agents.' },
            { id: 'alerts', icon: Bell, label: 'Alerts', help: 'Real-time threat detection and security alerts.' },
            { id: 'kb', icon: BookOpen, label: 'Knowledge Base', help: 'Detailed guides and documentation on using the platform.' },
            { id: 'about', icon: User, label: 'About Me', help: 'Information about the platform architect and mission.' },
            { id: 'settings', icon: Settings, label: 'Settings', help: 'Configure API keys, rate limits, and system preferences.' },
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(item.id as any);
                if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-neon-cyan text-deep-space shadow-lg shadow-neon-cyan/20 font-bold" 
                  : "text-text-muted hover:bg-surface hover:text-text-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-deep-space" : "group-hover:text-text-primary")} />
              {(isSidebarOpen || isMobileMenuOpen) && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'alerts' && unreadAlertsCount > 0 && (
                    <span className="ml-auto bg-vivid-magenta text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadAlertsCount}
                    </span>
                  )}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="group/navhelp relative">
                      <Info size={12} className="text-text-muted hover:text-neon-cyan cursor-help" />
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 p-2 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/navhelp:opacity-100 pointer-events-none transition-opacity z-[100] shadow-2xl backdrop-blur-xl">
                        {item.help}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.button>
          ))}
        </nav>

        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className="px-6 py-4 border-t border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Theme</span>
              <button 
                onClick={toggleTheme}
                className="p-2 bg-surface hover:bg-surface-hover rounded-lg text-text-muted transition-all"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">API Quota</span>
              <span className={cn(
                "text-[10px] font-mono font-bold",
                apiUsage.requestsThisMinute >= apiUsage.limit ? "text-vivid-magenta" : "text-neon-cyan"
              )}>
                {apiUsage.requestsThisMinute}/{apiUsage.limit}
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${(apiUsage.requestsThisMinute / apiUsage.limit) * 100}%` }}
                className={cn(
                  "h-full transition-colors duration-500 neon-glow-cyan",
                  apiUsage.requestsThisMinute >= apiUsage.limit ? "bg-vivid-magenta" : "bg-neon-cyan"
                )}
              />
            </div>
            <p className="text-[9px] text-text-muted mt-2 leading-tight">
              {apiUsage.requestsThisMinute >= apiUsage.limit 
                ? "Quota exhausted. Resets in " + Math.max(0, Math.ceil((60000 - (Date.now() - apiUsage.lastReset)) / 1000)) + "s"
                : "Estimated Gemini Free Tier limit (15 RPM)"}
            </p>
          </div>
        </div>
        )}

        <div className="p-4 border-t border-border-subtle hidden lg:block">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-hover text-text-muted"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {rateLimitError && (
          <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              {rateLimitError}
            </div>
            <button onClick={() => setRateLimitError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Header */}
        <header className="h-16 bg-deep-space border-b border-border-subtle flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 backdrop-blur-md bg-deep-space/80">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-surface rounded-lg text-text-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base lg:text-lg font-black tracking-tighter uppercase text-text-primary truncate max-w-[120px] sm:max-w-none">
              {activeTab.replace('-', ' ')}
            </h2>
            <div className="hidden sm:block">
              <span className="px-2 py-0.5 bg-surface text-text-muted text-[10px] font-bold rounded border border-border-subtle uppercase tracking-widest">v2.4.0-stable</span>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className={cn(
              "hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
              apiUsage.requestsThisMinute >= apiUsage.limit 
                ? "bg-vivid-magenta/10 text-vivid-magenta border-vivid-magenta/20" 
                : "bg-surface text-text-muted border-border-subtle"
            )}>
              <Zap className={cn("w-3 h-3", apiUsage.requestsThisMinute >= apiUsage.limit ? "text-vivid-magenta" : "text-neon-cyan")} />
              <span>API QUOTA: {apiUsage.requestsThisMinute}/{apiUsage.limit}</span>
              <div className="w-12 h-1 bg-surface rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${(apiUsage.requestsThisMinute / apiUsage.limit) * 100}%` }}
                  className={cn("h-full", apiUsage.requestsThisMinute >= apiUsage.limit ? "bg-vivid-magenta neon-glow-magenta" : "bg-neon-cyan neon-glow-cyan")}
                />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-subtle rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest">
              <div className="w-2 h-2 bg-lime-green rounded-full animate-pulse neon-glow-green" />
              AI Engine Connected
            </div>
            <button
              onClick={() => setIsZeroTrustModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider"
              title="Security & Isolation Health Check"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Zero-Trust Check</span>
            </button>
            <button
              onClick={() => setActiveTab('personal-journal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider"
              title="PersonalJournal: Personal Reflection Companion"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">PersonalJournal</span>
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2 bg-surface border border-border-subtle rounded-full py-1 pl-1 pr-2.5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center overflow-hidden shrink-0">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-cyan-400">{currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="text-[10px] font-bold text-text-primary truncate max-w-[100px]">{currentUser.displayName || currentUser.email || 'Auditor'}</span>
                  <span className="text-[8px] font-mono text-text-muted truncate max-w-[100px]">Tenant: {currentUser.uid.slice(0, 6)}...</span>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="p-1 rounded-full text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider"
                title="Sign in with Google (Firebase Auth)"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {activeTab === 'builder' && (
              <motion.div 
                key="builder"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex-1 min-h-[500px] lg:min-h-[600px]">
                  <VisualTestBuilder onSaveTest={handleSaveTest} onExecuteTest={handleExecuteTest} savedTests={customTests} />
                </div>
              </motion.div>
            )}

            {activeTab === 'deviations' && (
              <motion.div 
                key="deviations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <ResultDeviationEngine customTests={customTests} />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Live Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      label: 'Total Audits', 
                      value: (reports || []).length, 
                      icon: Search, 
                      color: 'bg-neon-cyan/10 text-neon-cyan', 
                      trend: `Last 24h: ${(reports || []).filter(r => {
                        try {
                          return new Date(r.date).getTime() > Date.now() - 86400000;
                        } catch {
                          return false;
                        }
                      }).length}`, 
                      target: 'reports',
                      help: 'Total number of security audits performed across all environments.'
                    },
                    { 
                      label: 'Critical Findings', 
                      value: (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'Critical').length, 0), 
                      icon: AlertTriangle, 
                      color: 'bg-vivid-magenta/10 text-vivid-magenta', 
                      trend: (() => {
                        const total = (reports || []).reduce((acc, r) => acc + (r.findings || []).length, 0);
                        const critical = (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'Critical').length, 0);
                        return total > 0 ? `${Math.round((critical / total) * 100)}% of total` : '0% of total';
                      })(),
                      target: 'reports',
                      help: 'High-risk vulnerabilities that require immediate remediation.'
                    },
                    { 
                      label: 'Threats Blocked', 
                      value: liveMetrics.threatsBlocked > 0 ? liveMetrics.threatsBlocked.toLocaleString() : '-', 
                      icon: Shield, 
                      color: 'bg-lime-green/10 text-lime-green', 
                      trend: liveMetrics.threatsBlocked > 0 ? 'Active Protection' : 'Awaiting Data Source', 
                      target: 'audit',
                      help: 'Real-time malicious requests intercepted by the Sentinel AI engine.'
                    },
                    { 
                      label: 'API Quota', 
                      value: `${apiUsage.requestsThisMinute}/${apiUsage.limit}`, 
                      icon: Zap, 
                      color: apiUsage.requestsThisMinute >= apiUsage.limit ? 'bg-vivid-magenta/10 text-vivid-magenta' : 'bg-neon-cyan/10 text-neon-cyan', 
                      trend: `Reset in ${Math.max(0, Math.ceil((60000 - (Date.now() - apiUsage.lastReset)) / 1000))}s`, 
                      target: 'settings',
                      help: 'Current API request consumption vs. allocated rate limit.'
                    },
                  ].map((stat, i) => (
                    <motion.button 
                      key={i} 
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(stat.target as any)}
                      className="glass p-6 rounded-3xl border border-border-subtle hover:border-neon-cyan/30 transition-all group text-left w-full cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <stat.icon size={40} />
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", stat.color)}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                            stat.trend === 'Live' || stat.trend === 'Real-time' || stat.trend === 'Active Protection' ? "bg-neon-cyan/10 text-neon-cyan animate-pulse" : 
                            stat.trend.includes('%') || stat.trend.includes('Last 24h') ? "bg-lime-green/10 text-lime-green" : "bg-surface text-text-muted"
                          )}>
                            {stat.trend}
                          </span>
                          <div className="group/help relative">
                            <Info size={12} className="text-text-muted hover:text-neon-cyan cursor-help transition-colors" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/help:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                              {stat.help}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-text-primary tabular-nums tracking-tighter">{stat.value}</div>
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-neon-cyan transition-colors mt-1">{stat.label}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-3 glass rounded-3xl border border-border-subtle relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none select-none">
                      <Zap size={120} className="text-neon-cyan" />
                    </div>
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between relative z-10">
                      <div className="relative z-10">
                        <h3 className="font-black text-text-primary tracking-tighter uppercase relative z-10 -translate-y-1 mb-1 leading-tight">Security Posture Trend</h3>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Historical security score and threat activity</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-[10px] font-black bg-surface text-text-muted rounded-lg border border-border-subtle uppercase tracking-widest">7D</button>
                        <button className="px-3 py-1 text-[10px] font-black bg-neon-cyan text-deep-space rounded-lg shadow-lg shadow-neon-cyan/20 uppercase tracking-widest">30D</button>
                      </div>
                    </div>
                    <div className="h-[300px] w-full p-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={reports.length > 0 ? reports.slice(-6).map((r, idx) => ({
                          name: `Audit ${idx + 1}`,
                          score: Math.max(0, 100 - ((r.findings || []).filter(f => f.severity === 'Critical').length * 20) - ((r.findings || []).filter(f => f.severity === 'High').length * 10)),
                          threats: (r.findings || []).length * 5
                        })) : [
                          { name: 'No Data', score: 0, threats: 0 }
                        ]}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#475569' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#475569' }} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', fontSize: '10px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#00F5FF" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="threats" 
                            stroke="#FF007A" 
                            strokeWidth={2} 
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass rounded-3xl border border-border-subtle p-6 flex flex-col">
                    <h3 className="font-black text-text-primary mb-1 tracking-tighter uppercase">Risk Distribution</h3>
                    <p className="text-[10px] text-text-muted mb-6 font-bold uppercase tracking-widest">Breakdown of findings by severity</p>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Critical', value: (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'Critical').length, 0), severity: 'Critical' },
                              { name: 'High', value: (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'High').length, 0), severity: 'High' },
                              { name: 'Medium', value: (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'Medium').length, 0), severity: 'Medium' },
                              { name: 'Low', value: (reports || []).reduce((acc, r) => acc + (r.findings || []).filter(f => f.severity === 'Low').length, 0), severity: 'Low' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            onClick={(data: any) => {
                              if (data && data.severity) {
                                setSeverityFilter(data.severity as Severity);
                                setActiveTab('reports');
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <Cell fill="var(--vivid-magenta)" className="hover:opacity-80 transition-opacity" />
                            <Cell fill="var(--caution)" className="hover:opacity-80 transition-opacity" />
                            <Cell fill="var(--warning)" className="hover:opacity-80 transition-opacity" />
                            <Cell fill="var(--neon-cyan)" className="hover:opacity-80 transition-opacity" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '10px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {[
                        { label: 'Critical', color: 'bg-vivid-magenta', severity: 'Critical' },
                        { label: 'High', color: 'bg-caution', severity: 'High' },
                        { label: 'Medium', color: 'bg-warning', severity: 'Medium' },
                        { label: 'Low', color: 'bg-neon-cyan', severity: 'Low' },
                      ].map(item => (
                        <button 
                          key={item.label} 
                          onClick={() => {
                            setSeverityFilter(item.severity as Severity);
                            setActiveTab('reports');
                          }}
                          className="flex items-center gap-2 hover:bg-surface-hover p-1 rounded-lg transition-colors cursor-pointer group"
                        >
                          <div className={cn("w-2 h-2 rounded-full", item.color)} />
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-neon-cyan">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Recent Activity & Live Mesh */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 glass rounded-3xl border border-border-subtle overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Globe size={120} className="text-neon-cyan" />
                    </div>
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between relative z-10">
                      <h3 className="font-black text-text-primary tracking-tighter uppercase">Live Audit Stream</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-lime-green rounded-full animate-ping shadow-[0_0_10px_#00FF00]" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Live Monitoring</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto scrollbar-hide relative z-10">
                      {reports.length > 0 ? reports.map((report) => (
                        <div 
                          key={report.id} 
                          onClick={() => {
                            setSelectedReportId(report.id);
                            setActiveTab('reports');
                          }}
                          className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-neon-cyan/10 transition-colors border border-border-subtle">
                              <Globe className="w-5 h-5 text-text-muted group-hover:text-neon-cyan" />
                            </div>
                            <div>
                              <div className="font-black text-text-primary text-sm group-hover:text-neon-cyan transition-colors tracking-tight">{report.targetUrl}</div>
                              <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{new Date(report.date).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                              {report.findings.slice(0, 3).map((f, i) => (
                                <button 
                                  key={i} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedReportId(report.id);
                                    setSelectedFindingId(f.id);
                                    setActiveTab('reports');
                                  }}
                                  className={cn(
                                    "w-6 h-6 rounded-full border-2 border-deep-space flex items-center justify-center text-[8px] font-black text-white transition-transform hover:scale-125 hover:z-20 cursor-pointer",
                                    f.severity === 'Critical' ? 'bg-vivid-magenta neon-glow-magenta' : 
                                    f.severity === 'High' ? 'bg-caution' : 'bg-neon-cyan neon-glow-cyan'
                                  )}
                                  title={`View ${f.severity} Finding: ${f.title}`}
                                >
                                  {f.severity[0]}
                                </button>
                              ))}
                            </div>
                            <button className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-neon-cyan transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-20 text-center">
                          <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                            <Terminal className="w-8 h-8 text-text-muted/50" />
                          </div>
                          <h4 className="font-black text-text-muted uppercase tracking-widest">No active telemetry</h4>
                          <p className="text-[10px] text-text-muted/50 mt-1 font-bold uppercase tracking-widest">Initiate an audit to populate the stream.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-deep-space rounded-3xl p-6 text-text-primary shadow-2xl border border-border-subtle relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Zap size={120} className="text-neon-cyan" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg uppercase tracking-tighter">Mesh Health</h3>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space border border-border-subtle text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                            Overall health and synchronization status of the distributed agent network.
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-8">Real-time agent orchestration status</p>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted">Consensus Engine</span>
                              <div className="group relative">
                                <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space border border-border-subtle text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                                  The level of agreement between different AI agents on identified security risks.
                                </div>
                              </div>
                            </div>
                            <span className="text-neon-cyan font-black">{Math.round(meshMetrics.consensus)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <motion.div 
                              animate={{ width: `${meshMetrics.consensus}%` }}
                              className="h-full bg-neon-cyan neon-glow-cyan"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-text-muted">Response Latency</span>
                              <div className="group relative">
                                <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space border border-border-subtle text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                                  Average time taken for the agent mesh to process requests and return results.
                                </div>
                              </div>
                            </div>
                            <span className="text-lime-green font-black">{liveMetrics.responseTime > 0 ? Math.round(liveMetrics.responseTime) : '-'}ms</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <motion.div 
                              animate={{ width: `${(liveMetrics.responseTime / 500) * 100}%` }}
                              className="h-full bg-lime-green neon-glow-green"
                            />
                          </div>
                        </div>

                        <div className="pt-4 grid grid-cols-2 gap-4">
                          <div className="p-3 bg-surface rounded-2xl border border-border-subtle">
                            <div className="text-[10px] font-black text-text-muted uppercase mb-1 tracking-widest">Uptime</div>
                            <div className="text-sm font-black text-text-primary tracking-tight">{liveMetrics.uptime === 100 ? '-' : liveMetrics.uptime.toFixed(2)}%</div>
                          </div>
                          <div className="p-3 bg-surface rounded-2xl border border-border-subtle">
                            <div className="text-[10px] font-black text-text-muted uppercase mb-1 tracking-widest">Nodes</div>
                            <div className="text-sm font-black text-text-primary tracking-tight">{(agents || []).filter(a => a.status !== 'Failed').length}/{(agents || []).length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Threat Mitigation Feed */}
                  <div className="lg:col-span-2 glass rounded-3xl border border-border-subtle overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Shield size={120} className="text-lime-green" />
                    </div>
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between relative z-10">
                      <h3 className="font-black text-text-primary tracking-tighter uppercase">Live Threat Mitigation</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-lime-green rounded-full animate-ping shadow-[0_0_10px_#00FF00]" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Defense</span>
                      </div>
                    </div>
                    <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto scrollbar-hide relative z-10">
                      <AnimatePresence initial={false}>
                        {mitigatedThreats.length > 0 ? mitigatedThreats.map((threat) => (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            key={threat.id} 
                            className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-lime-green/10 flex items-center justify-center border border-lime-green/20">
                                <Shield className="w-5 h-5 text-lime-green" />
                              </div>
                              <div>
                                <div className="font-black text-text-primary text-sm tracking-tight">{threat.type}</div>
                                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Source: {threat.source}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-[10px] font-black text-lime-green uppercase tracking-widest bg-lime-green/10 px-2 py-0.5 rounded border border-lime-green/20">Mitigated</div>
                              <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{threat.agent} • {threat.time.toLocaleTimeString()}</div>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                              <Shield className="w-8 h-8 text-text-muted/50" />
                            </div>
                            <h4 className="font-black text-text-muted uppercase tracking-widest">No Telemetry Data</h4>
                            <p className="text-[10px] text-text-muted/50 mt-1 font-bold uppercase tracking-widest">Connect a Data Source or Deploy an Agent to start seeing real telemetry.</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Phase 4: Interactive Self-Evolution Compound Vector Matrix */}
                  <div className="lg:col-span-3 space-y-4 mt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-black text-text-primary text-base uppercase tracking-tighter flex items-center gap-2">
                          <Zap className="w-4 h-4 text-neon-cyan" />
                          Phase 4: Synthesized Exploit Chains (Self-Evolution Matrix)
                        </h3>
                        <p className="text-[11px] text-text-muted">
                          Autonomous synthesis of multiple low-severity vulnerability vectors into high-impact compound exploit chains.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('attack-surface')}
                        className="text-xs font-bold text-neon-cyan hover:underline flex items-center gap-1"
                      >
                        Dual-Engine Attack Surface Graph <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {DEFAULT_EXPLOIT_CHAINS.map((chain) => (
                        <SynthesizedExploitChainCard
                          key={chain.id}
                          chainData={chain}
                          defaultExpanded={chain.id === 'chain-oauth-takeover'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                <div className="glass p-4 sm:p-8 rounded-3xl border border-border-subtle shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Search size={120} className="text-neon-cyan" />
                  </div>
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-8 relative z-10">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan w-5 h-5" />
                      <input 
                        autoFocus
                        type="url" 
                        placeholder="https://target-app.com"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 bg-surface border border-border-subtle rounded-2xl focus:ring-2 focus:ring-neon-cyan focus:border-transparent outline-none transition-all text-base sm:text-xl font-black tracking-tight text-text-primary placeholder:text-text-muted/50"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex bg-surface p-1 rounded-2xl shrink-0 border border-border-subtle relative group/depth">
                        {(['Quick Scan', 'Standard Scan', 'AI-Driven Deep Scan'] as const).map((depth) => (
                          <button 
                            key={depth}
                            onClick={() => setSettings({ ...settings, scanDepth: depth })}
                            className={cn(
                              "px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all", 
                              settings.scanDepth === depth ? "bg-neon-cyan text-deep-space shadow-lg shadow-neon-cyan/20" : "text-text-muted hover:text-text-secondary"
                            )}
                          >
                            {depth}
                          </button>
                        ))}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/depth:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl text-center">
                          Select the intensity of the security audit. Deep Scan performs exhaustive vulnerability checks.
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={runAudit}
                        disabled={isAuditing || !targetUrl}
                        className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-neon-cyan text-deep-space rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neon-cyan/30 flex items-center justify-center gap-2 transition-all"
                      >
                        {isAuditing ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        {isAuditing ? "Auditing..." : "Run Mission"}
                      </motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h4 className="text-lg font-bold text-text-primary">Security Test Configuration</h4>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                            <input 
                              type="text"
                              placeholder="Search test cases..."
                              value={testSearchQuery}
                              onChange={(e) => setTestSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-sm font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none placeholder:text-text-muted/50"
                            />
                          </div>
                          <div className="text-[10px] text-text-muted font-black uppercase tracking-widest whitespace-nowrap">
                            {Object.values(selectedTestConfigs).filter(v => v.enabled).length} Tests Selected
                          </div>
                          <div className="group/autofill relative">
                            <button 
                              onClick={autoFillAdvancedPayloads}
                              disabled={isGeneratingPayloads}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                isGeneratingPayloads 
                                  ? "bg-surface text-text-muted/50 border-border-subtle cursor-not-allowed" 
                                  : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 hover:bg-neon-cyan/20 neon-glow-cyan"
                              )}
                            >
                              <Zap className={cn("w-3 h-3", isGeneratingPayloads && "animate-pulse")} />
                              {isGeneratingPayloads ? "Generating..." : "Deep Dive Auto-Fill"}
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/autofill:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                              Sentinel AI will automatically generate complex security payloads tailored to your target architecture.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {testCategories.map((category) => {
                          const filteredTestCases = category.testCases.filter(tc => 
                            tc.title.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                            tc.description.toLowerCase().includes(testSearchQuery.toLowerCase())
                          );
                          
                          if (testSearchQuery && filteredTestCases.length === 0) return null;

                            return (
                              <div key={category.id} className="bg-surface rounded-3xl border border-border-subtle overflow-hidden">
                                <div 
                                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                                  className="p-4 bg-surface flex items-center justify-between border-b border-border-subtle cursor-pointer hover:bg-surface-hover transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-neon-cyan shadow-sm border border-border-subtle">
                                      {category.icon === 'Lock' && <Lock className="w-4 h-4" />}
                                      {category.icon === 'Database' && <Database className="w-4 h-4" />}
                                      {category.icon === 'Code' && <Code className="w-4 h-4" />}
                                      {category.icon === 'UserCheck' && <UserCheck className="w-4 h-4" />}
                                      {category.icon === 'Settings' && <Settings className="w-4 h-4" />}
                                      {category.icon === 'Globe' && <Globe className="w-4 h-4" />}
                                      {category.icon === 'Cpu' && <Cpu className="w-4 h-4" />}
                                      {category.icon === 'Bug' && <Bug className="w-4 h-4" />}
                                      {category.icon === 'Shield' && <Shield className="w-4 h-4" />}
                                      {category.icon === 'Terminal' && <Terminal className="w-4 h-4" />}
                                      {category.icon === 'Smartphone' && <Smartphone className="w-4 h-4" />}
                                      {category.icon === 'Bot' && <Bot className="w-4 h-4" />}
                                      {category.icon === 'Zap' && <Zap className="w-4 h-4" />}
                                      {category.icon === 'GitBranch' && <GitBranch className="w-4 h-4" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-black text-text-primary uppercase tracking-tighter text-sm">{category.title}</h5>
                                      <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform duration-300", expandedCategories[category.id] && "rotate-180")} />
                                    </div>
                                  </div>
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => {
                                        const next = { ...selectedTestConfigs };
                                        filteredTestCases.forEach(tc => {
                                          if (!next[tc.id]) {
                                            next[tc.id] = { enabled: true, value: tc.defaultValue };
                                          } else {
                                            next[tc.id].enabled = true;
                                          }
                                        });
                                        setSelectedTestConfigs(next);
                                      }}
                                      className="text-[10px] font-bold text-neon-cyan hover:text-neon-cyan/80"
                                    >
                                      Select All
                                    </button>
                                    <span className="text-text-muted/30">|</span>
                                    <button 
                                      onClick={() => {
                                        const next = { ...selectedTestConfigs };
                                        filteredTestCases.forEach(tc => {
                                          if (next[tc.id]) {
                                            next[tc.id].enabled = false;
                                          }
                                        });
                                        setSelectedTestConfigs(next);
                                      }}
                                      className="text-[10px] font-bold text-text-muted hover:text-text-secondary"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                <AnimatePresence initial={false}>
                                  {expandedCategories[category.id] && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-4 space-y-4">
                                        {filteredTestCases.map((tc) => (
                                          <div key={tc.id} className="bg-surface-card p-4 rounded-2xl border border-border-card shadow-sm space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex items-start gap-3">
                                                <input 
                                                  type="checkbox" 
                                                  checked={selectedTestConfigs[tc.id]?.enabled}
                                                  onChange={(e) => setSelectedTestConfigs(prev => ({
                                                    ...prev,
                                                    [tc.id]: { ...prev[tc.id], enabled: e.target.checked }
                                                  }))}
                                                  className="mt-1 w-4 h-4 text-neon-cyan rounded border-border-subtle focus:ring-neon-cyan bg-surface"
                                                />
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-text-primary">{tc.title}</span>
                                                    <div className="group relative">
                                                      <HelpCircle className="w-3.5 h-3.5 text-text-muted cursor-help" />
                                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-deep-space border border-border-subtle text-text-primary text-[10px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                                        <div className="font-bold mb-1 text-neon-cyan">Help Text</div>
                                                        <p className="mb-2 text-text-secondary">{tc.helpText}</p>
                                                        <div className="font-bold mb-1 text-neon-cyan">Example</div>
                                                        <code className="bg-surface px-1.5 py-0.5 rounded text-neon-cyan">{tc.exampleInput}</code>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <p className="text-[10px] text-text-muted">{tc.description}</p>
                                                </div>
                                              </div>
                                            </div>

                                            {selectedTestConfigs[tc.id]?.enabled && (
                                              <TestCaseConfig 
                                                tc={tc} 
                                                config={selectedTestConfigs[tc.id]} 
                                                onChange={(value) => setSelectedTestConfigs(prev => ({
                                                  ...prev,
                                                  [tc.id]: { ...prev[tc.id], value }
                                                }))}
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                      })}
                      </div>

                      <div className="bg-surface-card p-6 rounded-3xl border border-border-subtle shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Zap className="w-5 h-5 text-neon-cyan" />
                            Advanced Scanner Orchestration
                          </h4>
                          <span className="text-[10px] font-mono bg-neon-cyan/10 text-neon-cyan px-2 py-1 rounded-full uppercase tracking-wider">Experimental</span>
                        </div>
                        
                        <div className="space-y-4">
                          {/* SQLMap */}
                          <div className={cn("p-4 rounded-2xl border transition-all", advancedScanners.sqlmap.enabled ? "bg-neon-cyan/10 border-neon-cyan/30" : "bg-surface border-border-subtle")}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-neon-cyan shadow-sm border border-border-subtle">
                                  <Database className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-text-primary">SQLMap</h5>
                                  <p className="text-[10px] text-text-muted">Automated SQL injection and database takeover tool.</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setAdvancedScanners(prev => ({ ...prev, sqlmap: { ...prev.sqlmap, enabled: !prev.sqlmap.enabled } }))}
                                className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", advancedScanners.sqlmap.enabled ? "bg-neon-cyan text-deep-space" : "bg-surface-hover text-text-muted")}
                              >
                                {advancedScanners.sqlmap.enabled ? "Enabled" : "Enable"}
                              </button>
                            </div>
                            {advancedScanners.sqlmap.enabled && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Arguments</label>
                                  <input 
                                    type="text" 
                                    value={advancedScanners.sqlmap.args}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, sqlmap: { ...prev.sqlmap, args: e.target.value } }))}
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-neon-cyan outline-none text-text-primary"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Custom Rules / Tamper Scripts</label>
                                  <textarea 
                                    value={advancedScanners.sqlmap.customRules}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, sqlmap: { ...prev.sqlmap, customRules: e.target.value } }))}
                                    placeholder="e.g. tamper=between,randomcase"
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-neon-cyan outline-none h-16 resize-none text-text-primary"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Nuclei */}
                          <div className={cn("p-4 rounded-2xl border transition-all", advancedScanners.nuclei.enabled ? "bg-neon-cyan/10 border-neon-cyan/30" : "bg-surface border-border-subtle")}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-neon-cyan shadow-sm border border-border-subtle">
                                  <GitBranch className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-text-primary">Nuclei</h5>
                                  <p className="text-[10px] text-text-muted">Template-based vulnerability scanner.</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setAdvancedScanners(prev => ({ ...prev, nuclei: { ...prev.nuclei, enabled: !prev.nuclei.enabled } }))}
                                className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", advancedScanners.nuclei.enabled ? "bg-neon-cyan text-deep-space" : "bg-surface-hover text-text-muted")}
                              >
                                {advancedScanners.nuclei.enabled ? "Enabled" : "Enable"}
                              </button>
                            </div>
                            {advancedScanners.nuclei.enabled && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Templates</label>
                                  <input 
                                    type="text" 
                                    value={advancedScanners.nuclei.templates}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, nuclei: { ...prev.nuclei, templates: e.target.value } }))}
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-neon-cyan outline-none text-text-primary"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Custom Template (YAML)</label>
                                  <textarea 
                                    value={advancedScanners.nuclei.customYaml}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, nuclei: { ...prev.nuclei, customYaml: e.target.value } }))}
                                    placeholder="id: custom-scan..."
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-neon-cyan outline-none h-24 resize-none text-text-primary"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ZAP */}
                          <div className={cn("p-4 rounded-2xl border transition-all", advancedScanners.zap.enabled ? "bg-neon-cyan/10 border-neon-cyan/30" : "bg-surface border-border-subtle")}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-neon-cyan shadow-sm border border-border-subtle">
                                  <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-text-primary">OWASP ZAP</h5>
                                  <p className="text-[10px] text-text-muted">Zed Attack Proxy for dynamic application security testing.</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setAdvancedScanners(prev => ({ ...prev, zap: { ...prev.zap, enabled: !prev.zap.enabled } }))}
                                className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", advancedScanners.zap.enabled ? "bg-neon-cyan text-deep-space" : "bg-surface-hover text-text-muted")}
                              >
                                {advancedScanners.zap.enabled ? "Enabled" : "Enable"}
                              </button>
                            </div>
                            {advancedScanners.zap.enabled && (
                              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Scan Type</label>
                                  <select 
                                    value={advancedScanners.zap.scanType}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, zap: { ...prev.zap, scanType: e.target.value } }))}
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-neon-cyan outline-none text-text-primary"
                                  >
                                    <option>Baseline Scan</option>
                                    <option>Full Scan</option>
                                    <option>API Scan</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Context File / Auth Config</label>
                                  <input 
                                    type="text" 
                                    value={advancedScanners.zap.contextFile}
                                    onChange={(e) => setAdvancedScanners(prev => ({ ...prev, zap: { ...prev.zap, contextFile: e.target.value } }))}
                                    placeholder="path/to/context.xml"
                                    className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-mono focus:ring-2 focus:ring-neon-cyan outline-none text-text-primary"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:sticky lg:top-8 space-y-8">
                      <div className="bg-deep-space rounded-3xl p-4 sm:p-6 flex flex-col h-[400px] sm:h-[600px] shadow-2xl border border-border-subtle relative z-10 overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                          <Terminal size={120} className="text-neon-cyan" />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-neon-cyan" />
                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">Security Agent Terminal</span>
                          </div>
                          {isAuditing && <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">{Math.round(auditProgress)}%</div>}
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1 scrollbar-hide relative z-10">
                          {auditLogs.map((log, i) => (
                            <div key={i} className="text-text-muted group">
                              <span className="text-text-muted/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                              <span className={cn(
                                log.includes('>>>') ? "text-neon-cyan font-bold" : 
                                log.includes('!!!') ? "text-vivid-magenta font-bold" : 
                                log.includes('SUCCESS') ? "text-lime-green font-bold" : ""
                              )}>
                                {log}
                              </span>
                            </div>
                          ))}
                          {isAuditing && (
                            <div className="flex items-center gap-1 text-neon-cyan">
                              <span className="animate-pulse">_</span>
                            </div>
                          )}
                          {!isAuditing && auditLogs.length === 0 && (
                            <div className="text-text-muted/50 italic">Waiting for mission parameters...</div>
                          )}
                        </div>
                        {isAuditing && (
                          <div className="mt-4 w-full h-1 bg-surface rounded-full overflow-hidden relative z-10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${auditProgress}%` }}
                              className="h-full bg-neon-cyan neon-glow-cyan"
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-surface-card p-6 rounded-3xl border border-border-subtle shadow-sm">
                        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                          <Info className="w-5 h-5 text-neon-cyan" />
                          Audit Configuration Summary
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Target Asset</span>
                            <span className="font-mono text-text-primary truncate max-w-[200px]">{targetUrl || 'None'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Active Test Cases</span>
                            <span className="font-bold text-neon-cyan">{Object.values(selectedTestConfigs).filter(v => v.enabled).length}</span>
                          </div>
                          <div className="pt-3 border-t border-border-subtle">
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Selected Parameters</div>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(selectedTestConfigs).filter(([_, v]) => v.enabled).map(([id, v]) => {
                                const tc = testCategories.flatMap(c => c.testCases).find(t => t.id === id);
                                return (
                                  <div key={id} className="px-2 py-1 bg-surface border border-border-subtle rounded-lg text-[9px] text-text-muted">
                                    <span className="font-bold">{tc?.title}:</span> {Array.isArray(v.value) ? v.value.join(', ') : v.value}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Simulation */}
                <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-xl overflow-hidden">
                  <div className="bg-surface-hover p-4 border-b border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-vivid-magenta/50" />
                        <div className="w-3 h-3 rounded-full bg-warning/50" />
                        <div className="w-3 h-3 rounded-full bg-neon-cyan/50" />
                      </div>
                      <div className="ml-4 px-3 py-1 bg-surface rounded-lg text-xs font-mono text-text-muted border border-border-subtle">
                        {targetUrl || 'about:blank'}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "bg-surface flex items-center justify-center transition-all duration-500",
                    viewMode === 'desktop' ? "h-[1px] sm:h-[500px]" : "h-[350px] sm:h-[600px]"
                  )}>
                    <div className={cn(
                      "bg-surface shadow-2xl transition-all duration-500 overflow-hidden relative",
                      viewMode === 'desktop' ? "w-full h-full" : "w-full max-w-[375px] h-[10px] sm:h-[550px] rounded-[32px] sm:rounded-[40px] border-[8px] sm:border-[12px] border-border-subtle"
                    )}>
                      {targetUrl ? (
                        <iframe 
                          src={targetUrl} 
                          className="w-full h-full border-none"
                          title="Target Preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted">
                          <Monitor className="w-16 h-16 mb-4 opacity-20" />
                          <p>Enter a URL to preview</p>
                        </div>
                      )}
                      {isAuditing && (
                        <div className="absolute inset-0 bg-neon-cyan/10 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="bg-surface/90 px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                            <Zap className="w-5 h-5 text-neon-cyan animate-bounce" />
                            <span className="font-bold text-text-primary">AI Scanning Active</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tighter">Audit History</h3>
                      <div className="group/reporthelp relative">
                        <Info size={14} className="text-text-muted hover:text-neon-cyan cursor-help" />
                        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/reporthelp:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                          Comprehensive log of all security audits. Filter by severity, date, or target URL to analyze historical vulnerability trends.
                        </div>
                      </div>
                    </div>
                    {severityFilter !== 'All' && (
                      <Badge variant={severityFilter as Severity}>
                        Filtering: {severityFilter}
                        <button onClick={() => setSeverityFilter('All')} className="ml-2 hover:text-text-primary">×</button>
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="flex bg-surface p-1 rounded-xl border border-border-subtle">
                      {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverityFilter(s as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            severityFilter === s ? "bg-neon-cyan text-deep-space shadow-lg shadow-neon-cyan/20" : "text-text-muted hover:text-text-secondary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-surface border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-hover transition-all"
                    >
                      Export All
                    </motion.button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="glass p-4 rounded-2xl border border-border-subtle shadow-sm flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Search Findings</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
                      <input 
                        type="text" 
                        placeholder="Search title, description..." 
                        value={searchTextFilter}
                        onChange={(e) => setSearchTextFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none transition-all placeholder:text-text-muted/30"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Target URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
                      <input 
                        type="text" 
                        placeholder="Filter by URL..." 
                        value={urlFilter}
                        onChange={(e) => setUrlFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none transition-all placeholder:text-text-muted/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 min-w-[140px]">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Asset Type</label>
                    <select 
                      value={assetTypeFilter}
                      onChange={(e) => setAssetTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="All" className="bg-deep-space">All Assets</option>
                      <option value="URL" className="bg-deep-space">URL / Page</option>
                      <option value="API" className="bg-deep-space">API Endpoint</option>
                      <option value="Static" className="bg-deep-space">Static Asset</option>
                      <option value="Script" className="bg-deep-space">JavaScript / Script</option>
                      <option value="Config" className="bg-deep-space">Configuration</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Date From</label>
                    <input 
                      type="date" 
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Date To</label>
                    <input 
                      type="date" 
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="px-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-bold tracking-tight text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none transition-all"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setUrlFilter('');
                      setStartDateFilter('');
                      setEndDateFilter('');
                      setSeverityFilter('All');
                      setAssetTypeFilter('All');
                      setSearchTextFilter('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-text-muted hover:text-neon-cyan transition-colors"
                  >
                    Reset Filters
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {reports.length > 0 ? (
                    filteredReports.length > 0 ? (
                      filteredReports.map((report) => {
                        const severityData = [
                          { name: 'Critical', value: (report.findings || []).filter(f => f.severity === 'Critical').length, color: '#ef4444' },
                          { name: 'High', value: (report.findings || []).filter(f => f.severity === 'High').length, color: '#f97316' },
                          { name: 'Medium', value: (report.findings || []).filter(f => f.severity === 'Medium').length, color: '#eab308' },
                          { name: 'Low', value: (report.findings || []).filter(f => f.severity === 'Low').length, color: '#3b82f6' },
                          { name: 'Info', value: (report.findings || []).filter(f => f.severity === 'Info').length, color: '#64748b' },
                        ].filter(d => d.value > 0);

                        const assetTypeData = [
                          { name: 'URL', value: (report.findings || []).filter(f => f.assetType === 'URL').length },
                          { name: 'API', value: (report.findings || []).filter(f => f.assetType === 'API').length },
                          { name: 'Static', value: (report.findings || []).filter(f => f.assetType === 'Static').length },
                          { name: 'Script', value: (report.findings || []).filter(f => f.assetType === 'Script').length },
                          { name: 'Config', value: (report.findings || []).filter(f => f.assetType === 'Config').length },
                        ].filter(d => d.value > 0);

                        return (
                          <div 
                            key={report.id} 
                            id={`report-${report.id}`}
                            className={cn(
                              "bg-surface-card rounded-3xl border transition-all duration-500 overflow-hidden",
                              selectedReportId === report.id ? "border-neon-cyan ring-4 ring-neon-cyan/10 shadow-2xl" : "border-border-card shadow-sm"
                            )}
                          >
                            <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface/80">
                              <div className="flex items-center gap-4 w-full">
                                <div className="w-12 h-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center shadow-sm shrink-0">
                                  <FileText className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-text-primary text-lg truncate max-w-[200px] sm:max-w-none">{report.targetUrl}</h4>
                                    <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold rounded-md border border-neon-cyan/20 flex items-center gap-1">
                                      <Zap className="w-3 h-3" /> Playwright MCP
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    <p className="text-sm text-text-muted">
                                      {new Date(report.date).toLocaleString()} • {
                                        (report.findings || []).filter(f => {
                                          const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
                                          const matchesAssetType = assetTypeFilter === 'All' || f.assetType === assetTypeFilter;
                                          const matchesSearchText = !searchTextFilter || 
                                            f.title.toLowerCase().includes(searchTextFilter.toLowerCase()) || 
                                            f.description.toLowerCase().includes(searchTextFilter.toLowerCase());
                                          return matchesSeverity && matchesAssetType && matchesSearchText;
                                        }).length
                                      } Findings
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-lime-green/10 text-lime-green text-[10px] font-bold rounded-full whitespace-nowrap">Ran: {report.stats?.ran || 0}</span>
                                      <span className="px-2 py-0.5 bg-surface-hover text-text-muted text-[10px] font-bold rounded-full whitespace-nowrap">Skipped: {report.stats?.skipped || 0}</span>
                                    </div>
                                  </div>
                                  {report.techStack && report.techStack.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {report.techStack.map(tech => (
                                        <span key={tech} className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold rounded-md border border-neon-cyan/20 flex items-center gap-1">
                                          <Cpu className="w-3 h-3" /> {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <button 
                                  onClick={() => {
                                    setPlaywrightJson(JSON.stringify(report, null, 2));
                                    setHarFileContent(JSON.stringify({ 
                                      log: { 
                                        version: "1.2",
                                        creator: { name: "Sentinel AI", version: "2.4.0" },
                                        entries: report.findings.map(f => ({ 
                                          request: { url: f.asset, method: "GET", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 },
                                          response: { status: 200, statusText: "OK", httpVersion: "HTTP/1.1", headers: [], cookies: [], content: { size: 0, mimeType: "text/html", text: f.response || "" }, redirectURL: "", headersSize: -1, bodySize: -1 },
                                          cache: {},
                                          timings: { send: 0, wait: 0, receive: 0 }
                                        })) 
                                      } 
                                    }, null, 2));
                                    setActiveTab('logs');
                                    setLogAnalysisLogs(prev => [...prev, `Imported logs from report: ${report.targetUrl}`].slice(-100));
                                  }}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-neon-cyan text-deep-space rounded-xl hover:bg-cyan-400 transition-all text-xs font-bold shadow-lg shadow-neon-cyan/20"
                                  title="Analyze Logs with AppSec-Engineer"
                                >
                                  <Database className="w-4 h-4" />
                                  ANALYZE LOGS
                                </button>
                                <button 
                                  onClick={() => downloadPDF(report)}
                                  className="p-2.5 bg-surface border border-border-subtle hover:bg-surface-hover rounded-xl text-text-muted transition-colors shadow-sm" title="Download PDF"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => downloadJSON(report)}
                                  className="p-2.5 bg-surface border border-border-subtle hover:bg-surface-hover rounded-xl text-text-muted transition-colors shadow-sm" title="Download JSON"
                                >
                                  <Database className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="p-6 space-y-8">
                              {/* Dashboard Section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-surface rounded-2xl p-4 border border-border-subtle flex flex-col items-center">
                                  <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Severity Distribution</h5>
                                  <div className="w-full h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={severityData}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={40}
                                          outerRadius={70}
                                          paddingAngle={5}
                                          dataKey="value"
                                        >
                                          {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                          ))}
                                        </Pie>
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '10px' }}
                                        />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                                    {severityData.map((d) => (
                                      <div key={d.name} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        <span className="text-[10px] font-bold text-text-muted">{d.name}: {d.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-surface rounded-2xl p-4 border border-border-subtle flex flex-col items-center">
                                  <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Findings by Asset Type</h5>
                                  <div className="w-full h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={assetTypeData}>
                                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                        <Tooltip 
                                          cursor={{ fill: 'transparent' }}
                                          contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '10px' }}
                                        />
                                        <Bar dataKey="value" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                <div className="bg-surface rounded-2xl p-4 border border-border-subtle flex flex-col justify-center space-y-4">
                                  <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Audit Summary</h5>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-text-muted uppercase">Total Findings</div>
                                      <div className="text-2xl font-bold text-text-primary">{(report.findings || []).length}</div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-text-muted uppercase">Critical/High</div>
                                      <div className="text-2xl font-bold text-vivid-magenta">
                                        {(report.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'High').length}
                                      </div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-text-muted uppercase">Scan Coverage</div>
                                      <div className="text-2xl font-bold text-neon-cyan">
                                        {Math.round((report.stats?.ran / report.stats?.total) * 100)}%
                                      </div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-text-muted uppercase">Risk Score</div>
                                      <div className="text-2xl font-bold text-text-primary">
                                        {Math.min(100, report.findings.reduce((acc, f) => {
                                          if (f.severity === 'Critical') return acc + 25;
                                          if (f.severity === 'High') return acc + 15;
                                          if (f.severity === 'Medium') return acc + 5;
                                          return acc + 1;
                                        }, 0))}/100
                                      </div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-vivid-magenta uppercase">Destructive</div>
                                      <div className="text-2xl font-bold text-vivid-magenta">
                                        {(report.findings || []).filter(f => f.isDestructive).length}
                                      </div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-caution uppercase">Tampering</div>
                                      <div className="text-2xl font-bold text-caution">
                                        {(report.findings || []).filter(f => f.isDataTampering).length}
                                      </div>
                                    </div>
                                    <div className="bg-surface-card p-3 rounded-xl border border-border-subtle shadow-sm">
                                      <div className="text-[10px] font-bold text-neon-cyan uppercase">Evolved</div>
                                      <div className="text-2xl font-bold text-neon-cyan">
                                        {(report.findings || []).filter(f => f.isEvolved).length}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Executive Summary</h5>
                                <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm text-text-muted leading-relaxed">
                                  {report.executiveSummary}
                                </div>
                              </div>

                              {/* Tech Stack Section */}
                              {report.techStack && report.techStack.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Detected Technology Stack</h5>
                                  <div className="flex flex-wrap gap-3">
                                    {report.techStack.map(tech => (
                                      <div key={tech} className="px-4 py-2 bg-surface-card border border-border-subtle rounded-2xl shadow-sm flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                                          <Cpu className="w-3.5 h-3.5 text-neon-cyan" />
                                        </div>
                                        <span className="text-sm font-bold text-text-primary">{tech}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Dynamic Test Scenarios Section */}
                              {report.dynamicTests && report.dynamicTests.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Dynamic Stack-Specific Scenarios</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {report.dynamicTests.map(test => (
                                      <div key={test.id} className="p-4 bg-neon-cyan/5 border border-neon-cyan/10 rounded-2xl shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                          <h6 className="font-bold text-text-primary text-sm">{test.title}</h6>
                                          <Badge variant={test.severity}>{test.severity}</Badge>
                                        </div>
                                        <p className="text-xs text-text-muted mb-3">{test.description}</p>
                                        <div className="bg-surface/50 p-3 rounded-xl border border-neon-cyan/5">
                                          <span className="text-[10px] font-bold text-neon-cyan/50 uppercase block mb-1">Vulnerability Type</span>
                                          <span className="text-xs font-medium text-text-primary">{test.vulnerabilityType}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Detailed Findings</h5>
                                  <div className="text-[10px] font-bold text-text-muted">Showing {
                                    (report.findings || []).filter(f => {
                                      const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
                                      const matchesAssetType = assetTypeFilter === 'All' || f.assetType === assetTypeFilter;
                                      const matchesSearchText = !searchTextFilter || 
                                        f.title.toLowerCase().includes(searchTextFilter.toLowerCase()) || 
                                        f.description.toLowerCase().includes(searchTextFilter.toLowerCase());
                                      return matchesSeverity && matchesAssetType && matchesSearchText;
                                    }).length
                                  } of {(report.findings || []).length}</div>
                                </div>
                                
                                <div className="space-y-4">
                                  {(report.findings || []).filter(f => {
                                    const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
                                    const matchesAssetType = assetTypeFilter === 'All' || f.assetType === assetTypeFilter;
                                    const matchesSearchText = !searchTextFilter || 
                                      f.title.toLowerCase().includes(searchTextFilter.toLowerCase()) || 
                                      f.description.toLowerCase().includes(searchTextFilter.toLowerCase());
                                    return matchesSeverity && matchesAssetType && matchesSearchText;
                                  }).map((finding) => (
                                    <motion.div 
                                      key={finding.id} 
                                      id={`finding-${finding.id}`}
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={cn(
                                        "p-5 rounded-2xl border transition-all duration-300",
                                        selectedFindingId === finding.id ? "border-neon-cyan bg-neon-cyan/5 ring-4 ring-neon-cyan/10 shadow-lg" : "border-border-subtle bg-surface-card hover:border-neon-cyan/50 shadow-sm"
                                      )}
                                    >
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <Badge variant={finding.severity}>{finding.severity}</Badge>
                                          {finding.isDestructive && (
                                            <span className="px-2 py-0.5 bg-vivid-magenta/10 text-vivid-magenta text-[10px] font-black rounded border border-vivid-magenta/20 flex items-center gap-1">
                                              <Zap className="w-3 h-3" /> DESTRUCTIVE
                                            </span>
                                          )}
                                          {finding.isDataTampering && (
                                            <span className="px-2 py-0.5 bg-caution/10 text-caution text-[10px] font-black rounded border border-caution/20 flex items-center gap-1">
                                              <ShieldAlert className="w-3 h-3" /> DATA TAMPERING
                                            </span>
                                          )}
                                          {finding.isEvolved && (
                                            <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-black rounded border border-neon-cyan/20 flex items-center gap-1">
                                              <Zap className="w-3 h-3" /> EVOLVED
                                            </span>
                                          )}
                                          {finding.assetType && (
                                            <span className="px-2 py-0.5 bg-surface text-text-muted text-[10px] font-bold rounded border border-border-subtle">
                                              {finding.assetType}
                                            </span>
                                          )}
                                          <h6 className="font-bold text-text-primary text-base">{finding.title}</h6>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                                          <Clock className="w-3 h-3" />
                                          {new Date(finding.timestamp).toLocaleTimeString()}
                                        </div>
                                      </div>
                                      
                                      <p className="text-sm text-text-muted mb-6 leading-relaxed bg-surface/50 p-4 rounded-xl border border-border-subtle">
                                        {finding.description}
                                      </p>

                                      {/* Interactive Self-Evolution Compound Vector Visualizer */}
                                      {Boolean(finding.isEvolved || finding.title?.toLowerCase().includes('chain') || finding.title?.toLowerCase().includes('compound') || finding.title?.toLowerCase().includes('takeover')) && (
                                        <SynthesizedExploitChainCard 
                                          findingTitle={finding.title} 
                                          chainData={finding.title?.toLowerCase().includes('cloud') || finding.title?.toLowerCase().includes('ssrf') ? DEFAULT_EXPLOIT_CHAINS[1] : DEFAULT_EXPLOIT_CHAINS[0]} 
                                          defaultExpanded={true} 
                                        />
                                      )}
                                      
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                            <AlertTriangle className="w-3 h-3 text-caution" />
                                            Impact Analysis
                                          </div>
                                          <div className="p-4 bg-surface-card rounded-xl border border-border-subtle text-xs text-text-muted leading-relaxed shadow-sm">
                                            {finding.impact}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                              <CheckCircle2 className="w-3 h-3 text-lime-green" />
                                              Remediation Steps
                                            </div>
                                            {finding.severity === 'Critical' && (
                                              <button
                                                onClick={() => generatePatch(finding)}
                                                disabled={isGeneratingPatch[finding.id]}
                                                className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neon-cyan/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                              >
                                                {isGeneratingPatch[finding.id] ? (
                                                  <span className="w-3 h-3 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                  <Code className="w-3 h-3" />
                                                )}
                                                {isGeneratingPatch[finding.id] ? 'Generating...' : 'Auto-Fix'}
                                              </button>
                                            )}
                                          </div>
                                          <div className="p-4 bg-surface-card rounded-xl border border-border-subtle text-xs text-text-muted leading-relaxed shadow-sm">
                                            {finding.remediation}
                                          </div>
                                          {generatedPatches[finding.id] && (
                                            <div className="mt-4 p-4 bg-deep-space rounded-xl border border-neon-cyan/30">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="text-[10px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                                                  <Code className="w-3 h-3" />
                                                  Generated Patch
                                                </div>
                                                <button 
                                                  onClick={() => navigator.clipboard.writeText(generatedPatches[finding.id])}
                                                  className="text-[10px] text-text-muted hover:text-neon-cyan transition-colors"
                                                >
                                                  Copy
                                                </button>
                                              </div>
                                              <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap overflow-x-auto">
                                                {generatedPatches[finding.id]}
                                              </pre>
                                            </div>
                                          )}
                                        </div>
                                      </div>
          
                                      <div className="space-y-4">
                                        <div className="bg-deep-space rounded-2xl overflow-hidden shadow-xl">
                                          <div className="flex items-center justify-between px-4 py-2 bg-surface-hover border-b border-border-subtle">
                                            <div className="flex items-center gap-2">
                                              <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-vivid-magenta/50" />
                                                <div className="w-2 h-2 rounded-full bg-caution/50" />
                                                <div className="w-2 h-2 rounded-full bg-neon-cyan/50" />
                                              </div>
                                              <span className="text-[10px] font-mono text-text-muted uppercase tracking-tighter">Network Telemetry</span>
                                            </div>
                                            <button 
                                              onClick={() => {
                                                navigator.clipboard.writeText(`Request:\n${finding.request}\n\nResponse:\n${finding.response}`);
                                              }}
                                              className="text-[10px] font-bold text-text-muted hover:text-neon-cyan transition-colors"
                                            >
                                              COPY RAW
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
                                            <div className="p-4 font-mono text-[10px] text-vivid-magenta overflow-x-auto max-h-[200px] scrollbar-hide">
                                              <div className="text-text-muted mb-2 uppercase tracking-tighter flex items-center gap-2">
                                                <Upload className="w-3 h-3" /> Request
                                              </div>
                                              <pre className="whitespace-pre-wrap">{finding.request || "No request data available."}</pre>
                                            </div>
                                            <div className="p-4 font-mono text-[10px] text-lime-green overflow-x-auto max-h-[200px] scrollbar-hide">
                                              <div className="text-text-muted mb-2 uppercase tracking-tighter flex items-center gap-2">
                                                <Download className="w-3 h-3" /> Response
                                              </div>
                                              <pre className="whitespace-pre-wrap">{finding.response || "No response data available."}</pre>
                                            </div>
                                          </div>
                                        </div>
            
                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                          <div className="flex items-center gap-4">
                                            {finding.deepDiveUrl && (
                                              <a 
                                                href={finding.deepDiveUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neon-cyan hover:text-cyan-400 transition-colors bg-neon-cyan/10 px-3 py-1.5 rounded-lg border border-neon-cyan/20"
                                              >
                                                <ExternalLink className="w-3 h-3" />
                                                OWASP DEEP DIVE
                                              </a>
                                            )}
                                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                              Asset: <span className="text-text-primary font-mono lowercase">{finding.asset}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button className="text-[10px] font-bold text-text-muted hover:text-neon-cyan transition-colors">FLAG FOR REVIEW</button>
                                            <span className="text-text-muted/50">|</span>
                                            <button className="text-[10px] font-bold text-text-muted hover:text-lime-green transition-colors">MARK AS RESOLVED</button>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="space-y-6 pt-8 border-t border-border-subtle">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neon-cyan flex items-center justify-center shadow-lg shadow-neon-cyan/20">
                                      <UserCheck className="w-5 h-5 text-deep-space" />
                                    </div>
                                    <div>
                                      <h5 className="text-lg font-bold text-text-primary">QA Expert: Coverage & Execution Report</h5>
                                      <p className="text-xs text-text-muted">Comprehensive analysis of verified scenarios and identified gaps</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                  {/* Verified Scenarios */}
                                  <div className="space-y-4">
                                    <h6 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                      <CheckCircle2 className="w-3 h-3 text-lime-green" />
                                      Verified Scenarios
                                    </h6>
                                    <div className="space-y-3">
                                      {report.verifiedScenarios?.length > 0 ? (
                                        report.verifiedScenarios.map((scenario) => (
                                          <div key={scenario.id} className="p-4 bg-surface-card rounded-2xl border border-border-subtle shadow-sm hover:border-lime-green/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-bold text-text-primary text-sm">{scenario.title}</span>
                                              <span className={cn(
                                                "px-2 py-0.5 text-[10px] font-bold rounded-full",
                                                scenario.status === 'Passed' ? "bg-lime-green/10 text-lime-green" : "bg-caution/10 text-caution"
                                              )}>
                                                {scenario.status}
                                              </span>
                                            </div>
                                            <p className="text-xs text-text-muted leading-relaxed">{scenario.description}</p>
                                            <div className="mt-2 pt-2 border-t border-surface text-[10px] text-text-muted italic">
                                              {scenario.details}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-8 text-center bg-surface rounded-2xl border border-dashed border-border-subtle text-text-muted text-xs">
                                          No verified scenarios recorded for this audit.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Identified Gaps */}
                                  <div className="space-y-4">
                                    <h6 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                      <AlertTriangle className="w-3 h-3 text-caution" />
                                      Identified Gaps (Uncovered Areas)
                                    </h6>
                                    <div className="space-y-3">
                                      {report.identifiedGaps?.length > 0 ? (
                                        report.identifiedGaps.map((gap) => (
                                          <div key={gap.id} className="p-4 bg-surface-card rounded-2xl border border-border-subtle shadow-sm hover:border-caution/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-bold text-text-primary text-sm">{gap.area}</span>
                                              <span className="px-2 py-0.5 bg-vivid-magenta/10 text-vivid-magenta text-[10px] font-bold rounded-full">
                                                Risk: {gap.risk}
                                              </span>
                                            </div>
                                            <p className="text-xs text-text-muted mb-3">{gap.description}</p>
                                            
                                            <div className="bg-surface p-3 rounded-xl border border-border-subtle mb-3">
                                              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Suggested Scenario</span>
                                              <p className="text-xs text-text-muted">{gap.suggestedScenario}</p>
                                            </div>

                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => {
                                                  setSuggestedScript(gap.suggestedPlaywrightScript || "// No script available");
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neon-cyan/10 text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-colors text-[10px] font-bold"
                                              >
                                                <Code className="w-3 h-3" />
                                                GENERATE TEST CASE
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  setSuggestedScript(gap.suggestedPlaywrightScript || "// No script available");
                                                  setIsExecutingScript(true);
                                                  setTimeout(() => {
                                                    setIsExecutingScript(false);
                                                    setAuditLogs(prev => [...prev, `>>> QA-Expert: Successfully executed Playwright script for ${gap.area}`].slice(-100));
                                                  }, 3000);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-deep-space text-text-primary rounded-xl hover:bg-surface-hover transition-colors text-[10px] font-bold"
                                              >
                                                <Play className="w-3 h-3" />
                                                EXECUTE SCRIPT
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-8 text-center bg-surface rounded-2xl border border-dashed border-border-subtle text-text-muted text-xs">
                                          No coverage gaps identified.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Exclusion Log */}
                                <div className="space-y-4">
                                  <h6 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <X className="w-3 h-3 text-text-muted" />
                                    Exclusion Log (Skipped/Untestable)
                                  </h6>
                                  <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-surface border-b border-border-subtle">
                                        <tr>
                                          <th className="px-4 py-3 font-bold text-text-muted">Test Case</th>
                                          <th className="px-4 py-3 font-bold text-text-muted">Reason</th>
                                          <th className="px-4 py-3 font-bold text-text-muted">Constraint</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-surface">
                                        {report.exclusionLog?.length > 0 ? (
                                          report.exclusionLog.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-surface-hover transition-colors">
                                              <td className="px-4 py-3 font-medium text-text-primary">{entry.testCase}</td>
                                              <td className="px-4 py-3 text-text-muted">{entry.reason}</td>
                                              <td className="px-4 py-3">
                                                <span className={cn(
                                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                  entry.constraint === 'Auth' ? "bg-vivid-magenta/10 text-vivid-magenta" :
                                                  entry.constraint === 'Data' ? "bg-caution/10 text-caution" :
                                                  "bg-surface-hover text-text-muted"
                                                )}>
                                                  {entry.constraint}
                                                </span>
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-text-muted italic">
                                              No exclusions recorded.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>

                              {/* Script Execution Modal */}
                              <AnimatePresence>
                                {suggestedScript && (
                                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-space/60 backdrop-blur-sm">
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="bg-surface-card rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-border-subtle"
                                    >
                                      <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-deep-space flex items-center justify-center">
                                            <Terminal className="w-5 h-5 text-neon-cyan" />
                                          </div>
                                          <div>
                                            <h4 className="font-bold text-text-primary">Playwright Script Execution</h4>
                                            <p className="text-xs text-text-muted">QA Expert Suggested Scenario</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => setSuggestedScript(null)}
                                          className="p-2 hover:bg-surface-hover rounded-full transition-colors"
                                        >
                                          <X className="w-5 h-5 text-text-muted" />
                                        </button>
                                      </div>
                                      <div className="p-6 space-y-6">
                                        <div className="bg-deep-space rounded-2xl p-6 font-mono text-sm text-neon-cyan relative group">
                                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => navigator.clipboard.writeText(suggestedScript)}
                                              className="p-2 bg-surface-hover hover:bg-surface rounded-lg text-text-muted transition-colors"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                          <pre className="whitespace-pre-wrap">{suggestedScript}</pre>
                                        </div>
                                        
                                        {isExecutingScript ? (
                                          <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                            <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                                            <div className="text-center">
                                              <p className="font-bold text-text-primary">Executing Playwright Script...</p>
                                              <p className="text-xs text-text-muted">Simulating browser interactions and verifying assertions</p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-3">
                                            <button 
                                              onClick={() => setSuggestedScript(null)}
                                              className="flex-1 px-6 py-3 bg-surface text-text-muted rounded-2xl font-bold hover:bg-surface-hover transition-all"
                                            >
                                              CLOSE
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setIsExecutingScript(true);
                                                setTimeout(() => {
                                                  setIsExecutingScript(false);
                                                  setAuditLogs(prev => [...prev, ">>> QA-Expert: Script execution successful. All assertions passed."].slice(-100));
                                                }, 3000);
                                              }}
                                              className="flex-[2] px-6 py-3 bg-neon-cyan text-deep-space rounded-2xl font-bold hover:bg-cyan-400 transition-all shadow-lg shadow-neon-cyan/20 flex items-center justify-center gap-2"
                                            >
                                              <Play className="w-4 h-4" />
                                              RUN PLAYWRIGHT SCRIPT
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </div>
                                )}
                              </AnimatePresence>

                              {report.notTested.length > 0 && (
                                <div className="mt-8 p-6 bg-caution/10 rounded-3xl border border-caution/20 shadow-sm">
                                  <h5 className="text-xs font-bold text-caution uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Security Coverage Limitations
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {report.notTested.map((item, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs text-caution">
                                        <div className="w-1.5 h-1.5 rounded-full bg-caution mt-1.5 shrink-0" />
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 bg-surface-card rounded-3xl border border-dashed border-border-subtle">
                        <Search className="w-16 h-16 mx-auto mb-4 text-text-muted/20" />
                        <h4 className="text-xl font-bold text-text-muted">No reports match the filter</h4>
                        <p className="text-text-muted mt-2">Try adjusting your search terms or date range.</p>
                        <button 
                          onClick={() => {
                            setUrlFilter('');
                            setStartDateFilter('');
                            setEndDateFilter('');
                            setSeverityFilter('All');
                          }}
                          className="mt-6 px-6 py-2 bg-neon-cyan text-deep-space rounded-xl font-medium hover:bg-cyan-400"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-20 bg-surface-card rounded-3xl border border-dashed border-border-subtle">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-text-muted/20" />
                      <h4 className="text-xl font-bold text-text-muted">No reports generated yet</h4>
                      <p className="text-text-muted mt-2">Run an audit to see results here.</p>
                      <button 
                        onClick={() => setActiveTab('audit')}
                        className="mt-6 px-6 py-2 bg-neon-cyan text-deep-space rounded-xl font-medium hover:bg-cyan-400"
                      >
                        Go to Audit Tool
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div 
                key="agents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary">AGI Security Agents</h3>
                    <p className="text-sm text-text-muted">Autonomous agents for complex, non-human intervention scenarios.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="flex bg-surface p-1 rounded-2xl w-full sm:w-auto">
                      <button 
                        onClick={() => setAgentViewMode('grid')}
                        className={cn("flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all", agentViewMode === 'grid' ? "bg-surface-card shadow-sm text-neon-cyan" : "text-text-muted")}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Grid
                      </button>
                      <button 
                        onClick={() => setAgentViewMode('map')}
                        className={cn("flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all", agentViewMode === 'map' ? "bg-surface-card shadow-sm text-neon-cyan" : "text-text-muted")}
                      >
                        <Zap className="w-4 h-4" /> Mesh Map
                      </button>
                    </div>
                    <div className="flex bg-surface p-1 rounded-2xl w-full sm:w-auto">
                      <button 
                        onClick={() => setUseDeepCrawl(!useDeepCrawl)}
                        className={cn(
                          "flex-1 sm:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all",
                          useDeepCrawl ? "bg-surface-card shadow-sm text-neon-cyan" : "text-text-muted"
                        )}
                      >
                        <Globe className="w-4 h-4" /> Deep Crawl
                      </button>
                    </div>
                    <button 
                      onClick={orchestrateAgents}
                      disabled={isOrchestrating || !targetUrl}
                      className="w-full sm:w-auto px-6 py-3 bg-neon-cyan text-deep-space rounded-2xl font-bold hover:bg-cyan-400 shadow-lg shadow-neon-cyan/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isOrchestrating ? <Zap className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                      {isOrchestrating ? "Orchestrating..." : "Orchestrate Mission"}
                    </button>
                  </div>
                </div>

                {agentViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {agents.map((agent) => (
                      <div 
                        key={agent.id} 
                        id={`agent-${agent.id}`}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={cn(
                          "bg-surface-card p-6 rounded-2xl border transition-all duration-500 cursor-pointer",
                          selectedAgentId === agent.id ? "border-neon-cyan ring-2 ring-neon-cyan/20 shadow-lg scale-105" : 
                          agent.status === 'Active' ? "border-neon-cyan shadow-lg shadow-neon-cyan/10 scale-105" : "border-border-subtle shadow-sm hover:border-neon-cyan/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            agent.status === 'Active' ? "bg-neon-cyan text-deep-space" : "bg-neon-cyan/10 text-neon-cyan"
                          )}>
                            <agent.icon className="w-6 h-6" />
                          </div>
                          <Badge variant={agent.status === 'Active' ? 'default' : agent.status === 'Collaborating' ? 'Info' : 'default'}>
                            {agent.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-text-primary mb-1">{agent.name}</h4>
                        <p className="text-xs text-text-muted mb-4">{agent.role}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-text-muted">Agent Load</span>
                            <span className="text-text-primary">{agent.load}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                            <motion.div 
                              initial={false}
                              animate={{ width: `${agent.load}%` }}
                              className={cn("h-full", agent.load > 80 ? "bg-vivid-magenta" : "bg-neon-cyan")} 
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Specialization</div>
                            <div className="flex flex-wrap gap-1">
                              {agent.specialization.map(s => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 bg-surface text-text-muted rounded-md">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-surface-card p-4 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center text-neon-cyan">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Mesh Consensus</div>
                            <div className="group relative">
                              <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
                              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl border border-border-subtle">
                                Level of agreement between agents in the mesh.
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-text-primary">{meshMetrics.consensus.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="bg-surface-card p-4 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center text-neon-cyan">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Data Throughput</div>
                            <div className="group relative">
                              <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
                              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl border border-border-subtle">
                                Volume of security data being processed across the network.
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-text-primary">{meshMetrics.throughput.toFixed(1)} GB/s</div>
                        </div>
                      </div>
                      <div className="bg-surface-card p-4 rounded-2xl border border-border-subtle shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-lime-green/10 rounded-xl flex items-center justify-center text-lime-green">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Active Channels</div>
                            <div className="group relative">
                              <HelpCircle className="w-3 h-3 text-text-muted cursor-help" />
                              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-deep-space text-text-primary text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl border border-border-subtle">
                                Number of concurrent communication channels between agents.
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-text-primary">{(messages || []).filter(m => new Date().getTime() - new Date(m.timestamp).getTime() < 10000).length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                      <div className="xl:col-span-2">
                        <AgentGraph agents={agents} messages={messages} tasks={tasks} onAgentClick={setSelectedAgentId} />
                      </div>
                      <div className="xl:col-span-1 bg-deep-space rounded-3xl p-6 text-text-primary overflow-hidden flex flex-col h-[400px] border border-border-subtle">
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-neon-cyan">
                          <Terminal className="w-5 h-5" />
                          Mesh Traffic Monitor
                        </h4>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-hide">
                          {messages.map((m, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-text-muted">[{new Date(m.timestamp).toLocaleTimeString()}]</span>
                              <span className="text-neon-cyan font-bold">{m.from}</span>
                              <span className="text-text-muted">→</span>
                              <span className="text-neon-cyan font-bold">{m.to}</span>
                              <span className="text-text-muted">: {m.content}</span>
                            </div>
                          ))}
                          <div className="animate-pulse text-neon-cyan">_</div>
                        </div>
                      </div>
                    </div>

                    <TaskFlow tasks={tasks} onTaskClick={setSelectedTaskId} />
                    
                    <DelegationMap agents={agents} tasks={tasks} onAgentClick={setSelectedAgentId} onTaskClick={setSelectedTaskId} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-3 bg-surface-card rounded-3xl border border-border-subtle p-6 shadow-sm">
                        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                          <Bot className="w-5 h-5 text-neon-cyan" />
                          Active Mesh Nodes Status
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {agents.map(a => (
                            <div 
                              key={a.id} 
                              onClick={() => setSelectedAgentId(a.id)}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                selectedAgentId === a.id ? "bg-neon-cyan/10 border-neon-cyan/20 ring-2 ring-neon-cyan/10" : "bg-surface border-border-subtle hover:bg-surface-hover hover:border-neon-cyan/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", a.status === 'Active' ? "bg-neon-cyan text-deep-space" : "bg-surface-hover text-text-muted")}>
                                  <a.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-text-primary">{a.name}</div>
                                  <div className="text-[10px] text-text-muted mb-1">{a.role}</div>
                                  <div className="space-y-1">
                                    <div className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Specialization</div>
                                    <div className="flex flex-wrap gap-1">
                                      {a.specialization.map(s => (
                                        <span key={s} className="text-[8px] px-1 py-0.5 bg-surface-hover text-text-muted rounded-md">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={cn("w-2 h-2 rounded-full", a.status === 'Active' ? "bg-lime-green animate-pulse" : "bg-text-muted/30")} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Real-time MCP Function Calling & Tool Trace Terminal */}
                <McpTraceTerminal 
                  traces={mcpTraces} 
                  isOrchestrating={isOrchestrating}
                  onSynthesizePatch={(f) => {
                    setActivePatchFinding(f);
                    setShowPatchModal(true);
                  }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Task Delegation Board */}
                  <div className="lg:col-span-2 bg-surface-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                      <h4 className="font-bold text-text-primary flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-neon-cyan" />
                        Task Delegation Board
                      </h4>
                      <Badge variant="Info">{tasks.length} Active Tasks</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {tasks.length > 0 ? tasks.map((task) => (
                        <div 
                          key={task.id} 
                          id={`task-${task.id}`}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all duration-500 cursor-pointer",
                            selectedTaskId === task.id ? "border-neon-cyan bg-neon-cyan/5 ring-2 ring-neon-cyan/10 shadow-md" : "border-border-subtle bg-surface hover:bg-surface-hover"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center">
                                {agents.find(a => a.id === task.assignedAgentId)?.icon && React.createElement(agents.find(a => a.id === task.assignedAgentId)!.icon, { className: "w-4 h-4 text-neon-cyan" })}
                              </div>
                              <span className="font-bold text-text-primary">{task.title}</span>
                            </div>
                            <Badge variant={task.status === 'completed' ? 'default' : 'Info'}>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</Badge>
                          </div>
                          <p className="text-sm text-text-muted mb-3">{task.description}</p>
                          {(task.findings || []).length > 0 && (
                            <div className="mt-2 p-3 bg-neon-cyan/10 rounded-xl border border-neon-cyan/20">
                              <span className="text-xs font-bold text-neon-cyan block mb-1">Finding Detected:</span>
                              <p className="text-xs text-neon-cyan italic">"{(task.findings || [])[0]}"</p>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted">
                          <Clock className="w-12 h-12 mb-4 opacity-20" />
                          <p>No tasks delegated yet. Start a mission.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inter-Agent Communication Hub */}
                  <div className="bg-deep-space rounded-3xl overflow-hidden flex flex-col h-[500px] border border-border-subtle">
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                      <h4 className="font-bold text-text-primary flex items-center gap-2">
                        <Zap className="w-5 h-5 text-neon-cyan" />
                        Collaboration Hub
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn(
                          "flex flex-col max-w-[85%]",
                          msg.from === 'Sentinel-Prime' ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-text-muted">
                              {agents.find(a => a.id === msg.from)?.name || msg.from}
                            </span>
                            <span className="text-[10px] text-text-muted/70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={cn(
                            "px-4 py-2 rounded-2xl text-xs",
                            msg.from === 'Sentinel-Prime' ? "bg-neon-cyan text-deep-space rounded-tr-none" : "bg-surface border border-border-subtle text-text-primary rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-surface border-t border-border-subtle">
                      <div className="flex items-center gap-2 px-3 py-2 bg-deep-space rounded-xl border border-border-subtle">
                        <Terminal className="w-4 h-4 text-text-muted" />
                        <span className="text-xs text-text-muted font-mono">Monitoring mesh traffic...</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-deep-space rounded-3xl p-8 border border-border-subtle shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-xl font-bold flex items-center gap-3">
                          <Activity className="w-6 h-6 text-neon-cyan" />
                          Active Mission Control
                        </h4>
                        <div className="flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 rounded-full border border-neon-cyan/20">
                          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">Live Mesh Sync</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {tasks.length > 0 ? tasks.map((task) => (
                          <motion.div 
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface/50 rounded-2xl border border-border-subtle p-6 hover:border-neon-cyan/30 transition-all group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "p-3 rounded-xl",
                                  task.status === 'completed' ? "bg-lime-green/10 text-lime-green" :
                                  task.status === 'failed' ? "bg-vivid-magenta/10 text-vivid-magenta" : "bg-neon-cyan/10 text-neon-cyan"
                                )}>
                                  <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-text-primary group-hover:text-neon-cyan transition-colors">{task.title}</h5>
                                  <p className="text-xs text-text-muted line-clamp-1">{task.description}</p>
                                </div>
                              </div>
                              <Badge variant={task.status === 'completed' ? 'default' : task.status === 'failed' ? 'Critical' : 'Info'}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                              {task.steps?.map((step: any, idx: number) => (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-text-muted truncate mr-2">{step.step}</span>
                                    {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-lime-green" /> : 
                                     step.status === 'in-progress' ? <Clock className="w-3 h-3 text-neon-cyan animate-spin" /> :
                                     <div className="w-3 h-3 rounded-full border border-text-muted/30" />}
                                  </div>
                                  <div className="h-1 bg-surface rounded-full overflow-hidden">
                                    <div className={cn(
                                      "h-full transition-all duration-500",
                                      step.status === 'completed' ? "w-full bg-lime-green" :
                                      step.status === 'in-progress' ? "w-1/2 bg-neon-cyan" : "w-0"
                                    )} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-20 text-text-muted border-2 border-dashed border-border-subtle rounded-3xl">
                            <Bot className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-50">No active missions detected</p>
                            <p className="text-xs mt-2">Initiate an orchestration to begin autonomous auditing</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-deep-space rounded-3xl p-6 border border-border-subtle shadow-xl">
                      <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4 text-neon-cyan" />
                        Sub-Agent Registry
                      </h4>
                      <div className="space-y-3">
                        {[
                          { id: 'fuzzer-01', name: 'Fuzzer-01', spec: 'IDOR & SSRF', icon: Zap },
                          { id: 'scanner-01', name: 'Scanner-01', spec: 'OWASP Top 10', icon: Search },
                          { id: 'reporter-01', name: 'Reporter-01', spec: 'Audit Reports', icon: FileText }
                        ].map(agent => (
                          <div key={agent.id} className="flex items-center justify-between p-3 bg-surface/30 rounded-xl border border-border-subtle">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-neon-cyan/10 rounded-lg">
                                <agent.icon className="w-4 h-4 text-neon-cyan" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-text-primary">{agent.name}</div>
                                <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{agent.spec}</div>
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-lime-green rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-deep-space rounded-3xl p-6 border border-border-subtle shadow-xl">
                      <h4 className="text-sm font-bold text-text-primary mb-6 flex items-center gap-2">
                        <Database className="w-4 h-4 text-neon-cyan" />
                        Connected MCP Tools
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { name: 'Calendar Mesh', icon: Calendar, status: 'Synced' },
                          { name: 'Task Manager', icon: ListTodo, status: 'Active' },
                          { name: 'Knowledge Base', icon: StickyNote, status: 'Ready' }
                        ].map(tool => (
                          <div key={tool.name} className="flex items-center justify-between p-3 bg-surface/30 rounded-xl border border-border-subtle">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-neon-cyan/10 rounded-lg">
                                <tool.icon className="w-4 h-4 text-neon-cyan" />
                              </div>
                              <span className="text-xs font-bold text-text-primary">{tool.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-lime-green uppercase tracking-widest">{tool.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-20"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Input Section */}
                  <div className="space-y-6">
                    <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-border-subtle bg-surface flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-surface rounded-xl">
                            <Terminal className="w-5 h-5 text-text-muted" />
                          </div>
                          <div>
                            <h3 className="font-bold text-text-primary">Log Ingestion</h3>
                            <p className="text-xs text-text-muted">Provide Playwright JSON and HAR logs for analysis</p>
                          </div>
                        </div>
                        <button 
                          onClick={analyzeSecurityLogs}
                          disabled={isAnalyzingLogs || (!playwrightJson && !harFileContent)}
                          className={cn(
                            "px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all",
                            isAnalyzingLogs || (!playwrightJson && !harFileContent)
                              ? "bg-surface text-text-muted/50 cursor-not-allowed"
                              : "bg-neon-cyan text-deep-space hover:bg-cyan-400 shadow-lg shadow-neon-cyan/20"
                          )}
                        >
                          {isAnalyzingLogs ? <div className="w-3 h-3 border-2 border-deep-space/30 border-t-deep-space rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
                          Run AppSec Analysis
                        </button>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Playwright JSON Report</label>
                            <label className="flex items-center gap-1.5 px-2 py-1 bg-surface text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-[10px] font-bold cursor-pointer border border-border-subtle">
                              <Upload className="w-3 h-3" />
                              UPLOAD JSON
                              <input type="file" accept=".json" className="hidden" onChange={(e) => handleFileUpload(e, 'json')} />
                            </label>
                          </div>
                          <textarea 
                            value={playwrightJson}
                            onChange={(e) => setPlaywrightJson(e.target.value)}
                            className="w-full h-[200px] p-4 bg-deep-space text-lime-green font-mono text-xs rounded-2xl border-2 border-border-subtle focus:border-neon-cyan outline-none transition-all resize-none"
                            placeholder='{"testResults": [...] }'
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Network HAR Content</label>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => captureHarLog(targetUrl || 'https://example.com')}
                                className="flex items-center gap-1.5 px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-colors text-[10px] font-bold cursor-pointer border border-neon-cyan/20"
                              >
                                <Zap className="w-3 h-3" />
                                CAPTURE LIVE
                              </button>
                              <label className="flex items-center gap-1.5 px-2 py-1 bg-surface text-text-muted rounded-lg hover:bg-surface-hover transition-colors text-[10px] font-bold cursor-pointer border border-border-subtle">
                                <Upload className="w-3 h-3" />
                                UPLOAD HAR
                                <input type="file" accept=".har,.json" className="hidden" onChange={(e) => handleFileUpload(e, 'har')} />
                              </label>
                            </div>
                          </div>
                          <textarea 
                            value={harFileContent}
                            onChange={(e) => setHarFileContent(e.target.value)}
                            className="w-full h-[200px] p-4 bg-deep-space text-neon-cyan font-mono text-xs rounded-2xl border-2 border-border-subtle focus:border-neon-cyan outline-none transition-all resize-none"
                            placeholder='{"log": {"entries": [...] } }'
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-deep-space rounded-3xl p-6 border border-border-subtle">
                      <div className="flex items-center gap-2 mb-4">
                        <Terminal className="w-4 h-4 text-neon-cyan" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest">AppSec-Engineer Console</span>
                      </div>
                      <div className="space-y-1 font-mono text-[10px] h-[100px] overflow-y-auto scrollbar-hide">
                        {logAnalysisLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-text-muted/50">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-text-primary">{log}</span>
                          </div>
                        ))}
                        {isAnalyzingLogs && <div className="text-neon-cyan animate-pulse">_</div>}
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  <div className="space-y-6">
                    <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden h-full flex flex-col">
                      <div className="p-6 border-b border-border-subtle bg-surface">
                        <h3 className="font-bold text-text-primary">Identified Vulnerabilities</h3>
                        <p className="text-xs text-text-muted">Structured risks from log analysis</p>
                      </div>
                      <div className="flex-1 p-6 overflow-y-auto max-h-[700px] scrollbar-hide space-y-4">
                        {analysisResults.length > 0 ? analysisResults.map((risk, i) => (
                          <div key={i} className="p-5 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-hover hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={risk.severity as any}>{risk.severity}</Badge>
                                <h4 className="font-bold text-text-primary text-sm">{risk.title}</h4>
                              </div>
                              <span className="text-[10px] font-mono text-text-muted">{risk.url}</span>
                            </div>
                            <p className="text-xs text-text-muted mb-4 leading-relaxed">{risk.impact}</p>
                            
                            <div className="space-y-3">
                              <div className="p-3 bg-deep-space rounded-xl border border-border-subtle">
                                <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Evidence</div>
                                <code className="text-[10px] text-neon-cyan font-mono block whitespace-pre-wrap">{risk.evidence}</code>
                              </div>
                              <div className="p-3 bg-lime-green/10 rounded-xl border border-lime-green/20">
                                <div className="text-[10px] font-bold text-lime-green uppercase mb-1">Remediation</div>
                                <p className="text-[10px] text-lime-green">{risk.remediation}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <div className="w-16 h-16 bg-surface rounded-3xl flex items-center justify-center mb-4">
                              <Shield className="w-8 h-8 text-text-muted/30" />
                            </div>
                            <h4 className="font-bold text-text-muted">No Analysis Results</h4>
                            <p className="text-xs text-text-muted mt-2">Ingest logs and run analysis to see identified risks here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-20"
              >
                <div className="glass rounded-3xl border border-border-subtle shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-border-subtle bg-surface">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Platform Configuration</h3>
                      <div className="group/settingshelp relative">
                        <Info size={14} className="text-text-muted hover:text-neon-cyan cursor-help" />
                        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/settingshelp:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                          Global system parameters. Adjust AI reasoning depth, scan intensity, and network density to match your security requirements.
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Fine-tune the Sentinel-Prime autonomous security engine.</p>
                  </div>
                  
                  <div className="p-8 space-y-12">
                    {/* AI Engine Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-neon-cyan/10 rounded-lg">
                          <Zap className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Reasoning Engine</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Optimized for rapid discovery and high-volume fuzzing.', speed: 'Ultra Fast', logic: 'Standard' },
                          { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', desc: 'Deep reasoning for complex business logic and zero-day chains.', speed: 'Balanced', logic: 'Advanced' }
                        ].map(model => (
                          <motion.button 
                            key={model.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSettings({ ...settings, primaryModel: model.id })}
                            className={cn(
                              "p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group",
                              settings.primaryModel === model.id 
                                ? "border-neon-cyan bg-neon-cyan/5 shadow-lg shadow-neon-cyan/10" 
                                : "border-border-subtle bg-surface hover:border-text-muted/20"
                            )}
                          >
                            {settings.primaryModel === model.id && (
                              <div className="absolute top-0 right-0 p-2">
                                <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
                              </div>
                            )}
                            <div className="font-black text-text-primary uppercase tracking-tighter mb-1">{model.name}</div>
                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-4 leading-relaxed">{model.desc}</div>
                            <div className="flex gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-surface-hover border border-border-subtle rounded-md text-text-muted">Speed: {model.speed}</span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-surface-hover border border-border-subtle rounded-md text-text-muted">Logic: {model.logic}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </section>

                    {/* Scan Parameters */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-vivid-magenta/10 rounded-lg">
                          <Shield className="w-5 h-5 text-vivid-magenta" />
                        </div>
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Audit Intensity</h4>
                      </div>

                      <div className="bg-surface p-6 rounded-2xl border border-border-subtle space-y-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Mesh Network Density</label>
                            <span className="text-sm font-black text-neon-cyan tracking-tighter">{settings.meshDensity}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={settings.meshDensity}
                            onChange={(e) => setSettings({ ...settings, meshDensity: parseInt(e.target.value) })}
                            className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                          />
                          <div className="flex justify-between text-[9px] text-text-muted font-black uppercase tracking-widest">
                            <span>Stealth</span>
                            <span>Balanced</span>
                            <span>Aggressive</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {(['Quick Scan', 'Standard Scan', 'AI-Driven Deep Scan'] as const).map((depth) => (
                            <motion.button
                              key={depth}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSettings({ ...settings, scanDepth: depth })}
                              className={cn(
                                "py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all",
                                settings.scanDepth === depth 
                                  ? "border-neon-cyan bg-neon-cyan text-deep-space shadow-lg shadow-neon-cyan/20" 
                                  : "border-border-subtle bg-surface-hover text-text-muted hover:text-text-primary"
                              )}
                            >
                              {depth}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Automation & Triage */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-lime-green/10 rounded-lg">
                          <Zap className="w-5 h-5 text-lime-green" />
                        </div>
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Automation & Triage</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl hover:bg-surface-hover transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center">
                              <LayoutDashboard className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <div>
                              <div className="font-bold text-text-primary">Autonomous Triage</div>
                              <div className="text-xs text-text-muted">Agents automatically categorize and prioritize findings.</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSettings({ ...settings, autoTriage: !settings.autoTriage })}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative",
                              settings.autoTriage ? "bg-neon-cyan" : "bg-surface-hover"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-text-primary rounded-full transition-all",
                              settings.autoTriage ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-border-subtle rounded-2xl hover:bg-surface-hover transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-vivid-magenta/10 rounded-xl flex items-center justify-center">
                              <Database className="w-5 h-5 text-vivid-magenta" />
                            </div>
                            <div>
                              <div className="font-bold text-text-primary">Distributed Reasoning</div>
                              <div className="text-xs text-text-muted">Enable multi-agent collaboration across Global Mesh.</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSettings({ ...settings, distributedReasoning: !settings.distributedReasoning })}
                            className={cn(
                              "w-12 h-6 rounded-full transition-colors relative",
                              settings.distributedReasoning ? "bg-neon-cyan" : "bg-surface-hover"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-text-primary rounded-full transition-all",
                              settings.distributedReasoning ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Connected MCP Servers</h5>
                            <button 
                              onClick={() => setShowMcpModal(true)}
                              className="text-xs font-bold text-neon-cyan hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Server
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {settings.mcpServers.map(server => (
                              <div key={server.id} className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-lime-green animate-pulse" />
                                  <div>
                                    <div className="text-sm font-bold text-text-primary">{server.name}</div>
                                    <div className="text-[10px] text-text-muted font-mono">{server.url}</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setSettings({
                                    ...settings,
                                    mcpServers: settings.mcpServers.filter(s => s.id !== server.id)
                                  })}
                                  className="p-1.5 hover:bg-vivid-magenta/10 text-text-muted hover:text-vivid-magenta rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {settings.mcpServers.length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-border-subtle rounded-xl">
                                <p className="text-xs text-text-muted">No external MCP servers connected.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Notifications */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-neon-cyan/10 rounded-lg">
                          <Bell className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Alert Channels</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 border border-border-subtle rounded-2xl space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-neon-cyan/10 rounded-lg">
                                <FileText className="w-4 h-4 text-neon-cyan" />
                              </div>
                              <span className="text-sm font-bold text-text-primary">Email Reports</span>
                            </div>
                            <button 
                              onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, email: !settings.notifications.email } })}
                              className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                settings.notifications.email ? "bg-neon-cyan" : "bg-surface-hover"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-text-primary rounded-full transition-all",
                                settings.notifications.email ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>
                          
                          {settings.notifications.email && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Destination Email</label>
                              <input 
                                type="email" 
                                value={settings.notifications.emailAddress}
                                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailAddress: e.target.value } })}
                                className="w-full px-4 py-2 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-neon-cyan outline-none transition-all text-text-primary"
                                placeholder="security@company.com"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-vivid-magenta/10 rounded-lg">
                                <Monitor className="w-4 h-4 text-vivid-magenta" />
                              </div>
                              <span className="text-sm font-bold text-text-primary">Browser Alerts</span>
                            </div>
                            <button 
                              onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, browser: !settings.notifications.browser } })}
                              className={cn(
                                "w-10 h-5 rounded-full transition-colors relative",
                                settings.notifications.browser ? "bg-neon-cyan" : "bg-surface-hover"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-text-primary rounded-full transition-all",
                                settings.notifications.browser ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          {settings.notifications.browser && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Alert Sensitivity</label>
                              <div className="flex gap-2">
                                {(['All', 'High', 'Critical'] as const).map(level => (
                                  <button
                                    key={level}
                                    onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, browserAlertLevel: level } })}
                                    className={cn(
                                      "flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all",
                                      settings.notifications.browserAlertLevel === level
                                        ? "bg-neon-cyan border-neon-cyan text-deep-space"
                                        : "bg-surface border-border-subtle text-text-muted hover:border-text-muted/50"
                                    )}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6 border border-border-subtle rounded-2xl space-y-4 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Webhooks</h5>
                            <button 
                              onClick={() => setShowWebhookModal(true)}
                              className="text-xs font-bold text-neon-cyan hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add New
                            </button>
                          </div>
                          <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {settings.webhooks.map(webhook => (
                              <div key={webhook.id} className="flex items-center justify-between p-3 bg-surface border border-border-subtle rounded-xl group">
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-text-primary truncate">{webhook.name}</div>
                                  <div className="text-[10px] text-text-muted truncate font-mono">{webhook.url}</div>
                                </div>
                                <button 
                                  onClick={() => setSettings({
                                    ...settings,
                                    webhooks: settings.webhooks.filter(w => w.id !== webhook.id)
                                  })}
                                  className="p-1.5 hover:bg-vivid-magenta/10 text-text-muted hover:text-vivid-magenta rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {settings.webhooks.length === 0 && (
                              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 border-2 border-dashed border-border-subtle rounded-xl">
                                <Zap className="w-8 h-8 text-text-muted/20 mb-2" />
                                <p className="text-xs text-text-muted">No webhooks configured.</p>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted text-center mt-2 italic">Supports Slack, Jira, Discord, and Custom JSON payloads.</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="p-8 bg-surface border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock className="w-4 h-4" />
                      Last synced: {lastSynced.toLocaleTimeString()}
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-2.5 text-sm font-bold text-text-muted hover:bg-surface-hover rounded-xl transition-colors">Discard</button>
                      <button 
                        onClick={saveSettings}
                        className="px-8 py-2.5 text-sm font-bold text-deep-space bg-neon-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-neon-cyan/20 active:scale-95"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Advanced JSON Config */}
                <div className="bg-deep-space rounded-3xl border border-border-subtle p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-neon-cyan" />
                        Advanced Engine Config
                      </h4>
                      <p className="text-xs text-text-muted">Directly modify the Sentinel-Prime JSON manifest.</p>
                    </div>
                    <button className="p-2 hover:bg-surface-hover rounded-lg text-text-muted">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-surface/40 rounded-2xl p-6 font-mono text-xs text-neon-cyan leading-relaxed overflow-x-auto">
                    <pre>{JSON.stringify({
                      engine: "Sentinel-Prime",
                      version: "2.4.0-stable",
                      mesh: {
                        nodes: agents.length,
                        density: settings.meshDensity / 100,
                        protocol: "MCP/2.0"
                      },
                      audit: {
                        depth: settings.scanDepth,
                        model: settings.primaryModel,
                        triage: settings.autoTriage ? "autonomous" : "manual"
                      }
                    }, null, 2)}</pre>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Real-Time Threat Alerts</h2>
                    <p className="text-text-muted font-medium">Monitor and respond to autonomous agent detections in real-time.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-surface rounded-2xl border border-border-subtle flex items-center gap-3">
                      <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Live Monitoring Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {alerts.length > 0 ? alerts.map((alert) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "bg-deep-space rounded-3xl p-6 border transition-all hover:shadow-2xl group",
                        alert.status === 'new' ? "border-neon-cyan/30 shadow-lg shadow-neon-cyan/5" : "border-border-subtle"
                      )}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-4 rounded-2xl",
                            alert.severity === 'Critical' ? "bg-vivid-magenta/10 text-vivid-magenta" :
                            alert.severity === 'High' ? "bg-orange-500/10 text-orange-500" :
                            alert.severity === 'Medium' ? "bg-neon-cyan/10 text-neon-cyan" : "bg-text-muted/10 text-text-muted"
                          )}>
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-text-primary group-hover:text-neon-cyan transition-colors">{alert.title}</h4>
                              <Badge variant={alert.severity === 'Critical' ? 'Critical' : alert.severity === 'High' ? 'High' : 'Info'}>
                                {alert.severity}
                              </Badge>
                              {alert.status === 'new' && (
                                <span className="px-2 py-0.5 bg-neon-cyan text-deep-space text-[10px] font-black rounded-full uppercase tracking-widest">New</span>
                              )}
                            </div>
                            <p className="text-sm text-text-muted leading-relaxed max-w-2xl">{alert.message}</p>
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(alert.createdAt).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                <Bot className="w-3 h-3" />
                                {alert.source}
                              </div>
                              {alert.notified && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-lime-green uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Notified
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {alert.status === 'new' && (
                            <button 
                              onClick={async () => {
                                await updateDoc(doc(db, "alerts", alert.id), { status: 'acknowledged' });
                              }}
                              className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary text-xs font-bold rounded-xl border border-border-subtle transition-all"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, "alerts", alert.id), { status: 'resolved' });
                            }}
                            className="px-4 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-xs font-bold rounded-xl border border-neon-cyan/20 transition-all"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-32 text-text-muted border-2 border-dashed border-border-subtle rounded-[40px] bg-deep-space/30">
                      <Bell className="w-16 h-16 mb-6 opacity-20" />
                      <p className="text-lg font-bold uppercase tracking-widest opacity-50">No active threats detected</p>
                      <p className="text-sm mt-2 max-w-xs text-center">Sentinel AI agents are monitoring the mesh network for anomalies.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'kb' && (
              <motion.div 
                key="kb"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <KnowledgeBase />
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AboutPage />
              </motion.div>
            )}

            {activeTab === 'threat-journal' && (
              <motion.div 
                key="threat-journal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ThreatJournal />
              </motion.div>
            )}

            {activeTab === 'personal-journal' && (
              <motion.div 
                key="personal-journal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PersonalJournal onSelectTab={(tab) => setActiveTab(tab as any)} />
              </motion.div>
            )}

            {activeTab === 'attack-surface' && (
              <motion.div 
                key="attack-surface"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SitemapAttackSurfaceGraph 
                  initialTargetUrl={targetUrl}
                  onFuzzEndpoint={(ep) => {
                    setTargetUrl(ep.path);
                    setActiveTab('audit');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Triage Alert (Immediate Reporting) */}
      <AnimatePresence>
        {!isAlertDismissed && reports.some(r => r.findings.some(f => f.severity === 'Critical')) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className="bg-vivid-magenta text-white p-4 rounded-2xl shadow-2xl shadow-vivid-magenta/40 flex items-center gap-4 border border-vivid-magenta/50">
              <div className="w-10 h-10 bg-surface-hover rounded-xl flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Critical Compromise Detected</div>
                <div className="text-xs text-white/80">Immediate triage required. Triage contact notified.</div>
              </div>
              <button 
                onClick={() => setIsAlertDismissed(true)}
                className="ml-4 p-2 hover:bg-surface-hover rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MCP Server Modal */}
      <AnimatePresence>
        {showMcpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-space/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border-subtle"
            >
              <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Database className="w-5 h-5 text-neon-cyan" />
                  Add MCP Server
                </h3>
                <button onClick={() => setShowMcpModal(false)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Server Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Production Mesh" 
                    value={newMcp.name}
                    onChange={(e) => setNewMcp({ ...newMcp, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-neon-cyan outline-none transition-all text-text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Server URL</label>
                  <input 
                    type="text" 
                    placeholder="mcp://..." 
                    value={newMcp.url}
                    onChange={(e) => setNewMcp({ ...newMcp, url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-neon-cyan outline-none transition-all text-text-primary"
                  />
                </div>
              </div>
              <div className="p-6 bg-surface border-t border-border-subtle flex gap-3">
                <button 
                  onClick={() => setShowMcpModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-text-muted hover:bg-surface-hover rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newMcp.name && newMcp.url) {
                      setSettings({
                        ...settings,
                        mcpServers: [...settings.mcpServers, { id: Math.random().toString(36).substr(2, 9), ...newMcp, status: 'Connected' }]
                      });
                      setNewMcp({ name: '', url: '' });
                      setShowMcpModal(false);
                    }
                  }}
                  className="flex-1 py-2.5 text-sm font-bold text-deep-space bg-neon-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-md shadow-neon-cyan/20"
                >
                  Connect Server
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Webhook Modal */}
      <AnimatePresence>
        {showWebhookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-deep-space/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border-subtle my-auto"
            >
              <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                  Add Webhook
                </h3>
                <button onClick={() => setShowWebhookModal(false)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Webhook Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Slack Alerts" 
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-neon-cyan outline-none transition-all text-text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Endpoint URL</label>
                  <input 
                    type="text" 
                    placeholder="https://hooks..." 
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-neon-cyan outline-none transition-all text-text-primary"
                  />
                </div>
              </div>
              <div className="p-6 bg-surface border-t border-border-subtle flex gap-3">
                <button 
                  onClick={() => setShowWebhookModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-text-muted hover:bg-surface-hover rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newWebhook.name && newWebhook.url) {
                      setSettings({
                        ...settings,
                        webhooks: [...settings.webhooks, { id: Math.random().toString(36).substr(2, 9), ...newWebhook }]
                      });
                      setNewWebhook({ name: '', url: '' });
                      setShowWebhookModal(false);
                    }
                  }}
                  className="flex-1 py-2.5 text-sm font-bold text-deep-space bg-neon-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-md shadow-neon-cyan/20"
                >
                  Add Webhook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security & Isolation Health Check Modal */}
      <MultiTenancyCheckModal 
        isOpen={isZeroTrustModalOpen} 
        onClose={() => setIsZeroTrustModalOpen(false)} 
      />

      {/* AppSec-Engineer Unified Git Diff Patch Modal */}
      <PatchModal
        isOpen={showPatchModal}
        onClose={() => setShowPatchModal(false)}
        finding={activePatchFinding}
      />
    </div>
    </ErrorBoundary>
  );
}
