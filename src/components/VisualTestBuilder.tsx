import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  ConnectionMode,
  Node,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Globe, 
  MousePointer2, 
  Terminal, 
  Shield, 
  AlertTriangle, 
  Zap, 
  Info, 
  Lock, 
  Cpu, 
  Cloud, 
  Play, 
  Settings2, 
  Trash2, 
  Plus,
  ChevronRight,
  Activity,
  Bug,
  Search,
  Crosshair,
  FileSearch,
  Save,
  FolderOpen,
  Code,
  Download,
  X,
  ShieldAlert,
  LockKeyhole,
  FileCode2,
  FileWarning,
  KeyRound,
  Eye,
  Users,
  Ghost,
  TerminalSquare,
  Wifi,
  Sparkles,
  ChevronDown,
  Bot,
  MessageSquare,
  Flame,
  FileCode,
  Paperclip,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { fetchFlowFromText, fetchAuditFlow } from '../services/agentService';
import { FlowAuditModal } from './FlowAuditModal';
import { FlowAIChatDrawer, PREDEFINED_SCENARIOS } from './FlowAIChatDrawer';
import { PatchModal } from './PatchModal';

// --- Custom Node Components ---

const NodeWrapper = function NodeWrapper({ children, title, icon: Icon, color, isVulnerable, selected }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-xl p-4 min-w-[200px] border-l-4 transition-all ${selected ? 'ring-2 ring-neon-cyan' : ''} ${isVulnerable ? 'border-vivid-magenta neon-glow-magenta' : ''}`}
      style={{ borderLeftColor: isVulnerable ? '#FF007A' : color }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-surface ${isVulnerable ? 'text-vivid-magenta' : ''}`} style={{ color: isVulnerable ? '#FF007A' : color }}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-black tracking-tighter text-text-primary uppercase">{title}</span>
        {isVulnerable && (
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto"
          >
            <Shield size={14} className="text-vivid-magenta" />
          </motion.div>
        )}
      </div>
      <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest space-y-1">
        {children}
      </div>
    </motion.div>
  );
};

const InputNode = function InputNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "User Input"} icon={MousePointer2} color="#00F5FF" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Type:</span>
        <span className="text-neon-cyan">{data.inputType || 'JSON'}</span>
      </div>
      <div className="flex justify-between">
        <span>Source:</span>
        <span className="text-neon-cyan">{data.source || 'Web Client'}</span>
      </div>
      {data.isVulnerable && (
        <div className="mt-3 pt-2 border-t border-border-subtle text-[9px] text-vivid-magenta font-black flex items-center gap-1">
          <AlertTriangle size={10} /> UNVALIDATED INPUT
        </div>
      )}
    </NodeWrapper>
  );
};

const APICallNode = function APICallNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "API Request"} icon={Globe} color="#A0AEC0" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Method:</span>
        <span className="text-text-secondary">{data.method || 'POST'}</span>
      </div>
      <div className="flex justify-between">
        <span>Endpoint:</span>
        <span className="text-text-secondary truncate max-w-[100px]">{data.endpoint || '/api/v1'}</span>
      </div>
    </NodeWrapper>
  );
};

const DBQueryNode = function DBQueryNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "DB Query"} icon={Database} color="#00FF00" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Table:</span>
        <span className="text-lime-green">{data.table || 'users'}</span>
      </div>
      <div className="flex justify-between">
        <span>Action:</span>
        <span className="text-lime-green">{data.action || 'SELECT'}</span>
      </div>
      {data.isVulnerable && (
        <div className="mt-3 pt-2 border-t border-border-subtle text-[9px] text-vivid-magenta font-black flex items-center gap-1">
          <Zap size={10} /> SQL INJECTION RISK
        </div>
      )}
    </NodeWrapper>
  );
};

const AuthNode = function AuthNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Auth Guard"} icon={Lock} color="#FFD700" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Strategy:</span>
        <span className="text-yellow-400">{data.strategy || 'JWT'}</span>
      </div>
      <div className="flex justify-between">
        <span>Scope:</span>
        <span className="text-yellow-400">{data.scope || 'admin'}</span>
      </div>
    </NodeWrapper>
  );
};

const CacheNode = function CacheNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Cache Layer"} icon={Cpu} color="#FF8C00" selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Provider:</span>
        <span className="text-orange-400">{data.provider || 'Redis'}</span>
      </div>
      <div className="flex justify-between">
        <span>TTL:</span>
        <span className="text-orange-400">{data.ttl || '300s'}</span>
      </div>
    </NodeWrapper>
  );
};

const CloudNode = function CloudNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "External API"} icon={Cloud} color="#1E90FF" selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Service:</span>
        <span className="text-blue-400">{data.service || 'Stripe'}</span>
      </div>
    </NodeWrapper>
  );
};

const TerminalNode = function TerminalNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Output"} icon={Terminal} color="#A0AEC0" selected={selected}>
      <Handle type="target" position={Position.Left} />
      <div className="flex justify-between">
        <span>Status:</span>
        <span className="text-lime-green">{data.status || '200 OK'}</span>
      </div>
      <div className="flex justify-between">
        <span>Latency:</span>
        <span className="text-text-secondary">{data.latency || '42ms'}</span>
      </div>
    </NodeWrapper>
  );
};

const CrawlerNode = function CrawlerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "AI Security Crawler"} icon={Search} color="#00F5FF" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Engine:</span>
        <span className="text-neon-cyan truncate max-w-[80px]">{data.engine || 'AI-driven deep scan'}</span>
      </div>
      <div className="flex justify-between">
        <span>Depth:</span>
        <span className="text-neon-cyan">{data.depth || '3'}</span>
      </div>
      {data.deepScanFlags && (
        <div className="flex justify-between mt-1 pt-1 border-t border-border-subtle/30">
          <span>Flags:</span>
          <span className="text-neon-cyan truncate max-w-[80px]">{data.deepScanFlags}</span>
        </div>
      )}
    </NodeWrapper>
  );
};

const ScannerNode = function ScannerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Scanner"} icon={Crosshair} color="#FF007A" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-vivid-magenta">{data.tool || 'Nmap'}</span>
      </div>
      <div className="flex justify-between">
        <span>Target:</span>
        <span className="text-vivid-magenta truncate max-w-[80px]">{data.target || 'localhost'}</span>
      </div>
    </NodeWrapper>
  );
};

const FuzzerNode = function FuzzerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Fuzzer"} icon={Bug} color="#FFD700" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-yellow-400">{data.tool || 'SQLMap'}</span>
      </div>
      <div className="flex justify-between">
        <span>Payload:</span>
        <span className="text-yellow-400 truncate max-w-[80px]">{data.payload || 'Default'}</span>
      </div>
    </NodeWrapper>
  );
};

const ExploitNode = function ExploitNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Exploit"} icon={Zap} color="#FF0000" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Payload:</span>
        <span className="text-red-500">{data.payload || 'Reverse Shell'}</span>
      </div>
    </NodeWrapper>
  );
};

const ProxyNode = function ProxyNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Proxy"} icon={Shield} color="#A0AEC0" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-text-secondary">{data.tool || 'Burp Suite'}</span>
      </div>
    </NodeWrapper>
  );
};

const ReporterNode = function ReporterNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Reporter"} icon={FileSearch} color="#00FF00" selected={selected}>
      <Handle type="target" position={Position.Left} />
      <div className="flex justify-between">
        <span>Format:</span>
        <span className="text-lime-green">{data.format || 'PDF'}</span>
      </div>
    </NodeWrapper>
  );
};

const DirTraversalNode = function DirTraversalNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Dir Traversal"} icon={FolderOpen} color="#FF8C00" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Depth:</span>
        <span className="text-orange-500">{data.depth || '5'}</span>
      </div>
    </NodeWrapper>
  );
};

const CSRFTesterNode = function CSRFTesterNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "CSRF Tester"} icon={ShieldAlert} color="#FF1493" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tokens:</span>
        <span className="text-pink-500">{data.tokens || 'Bypass'}</span>
      </div>
    </NodeWrapper>
  );
};

const SSLAnalyzerNode = function SSLAnalyzerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "SSL/TLS Analyzer"} icon={LockKeyhole} color="#00CED1" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Ciphers:</span>
        <span className="text-teal-500">{data.ciphers || 'Check Weak'}</span>
      </div>
    </NodeWrapper>
  );
};

const LogicFuzzerNode = function LogicFuzzerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Logic Fuzzer"} icon={Cpu} color="#4B0082" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Flow:</span>
        <span className="text-indigo-500">{data.flow || 'Circumvent'}</span>
      </div>
    </NodeWrapper>
  );
};

const DOMXSSNode = function DOMXSSNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "DOM XSS"} icon={FileCode2} color="#32CD32" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Sinks:</span>
        <span className="text-lime-500">{data.sinks || 'eval, innerHTML'}</span>
      </div>
    </NodeWrapper>
  );
};

const SubdomainEnumNode = function SubdomainEnumNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Subdomain Enum"} icon={Search} color="#00BFFF" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Wordlist:</span>
        <span className="text-cyan-500">{data.wordlist || 'Top 10k'}</span>
      </div>
    </NodeWrapper>
  );
};

const HTTPTampererNode = function HTTPTampererNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "HTTP Tamperer"} icon={FileWarning} color="#DC143C" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Verbs:</span>
        <span className="text-rose-500">{data.verbs || 'PUT, DELETE'}</span>
      </div>
    </NodeWrapper>
  );
};

const SessionTesterNode = function SessionTesterNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Session Tester"} icon={KeyRound} color="#8A2BE2" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Check:</span>
        <span className="text-violet-500">{data.check || 'Fixation'}</span>
      </div>
    </NodeWrapper>
  );
};

const SnifferNode = function SnifferNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Sniffer"} icon={Eye} color="#00BFFF" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-cyan-500">{data.tool || 'Wireshark'}</span>
      </div>
    </NodeWrapper>
  );
};

const PasswordCrackerNode = function PasswordCrackerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Password Cracker"} icon={KeyRound} color="#FF4500" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-red-500">{data.tool || 'John the Ripper'}</span>
      </div>
    </NodeWrapper>
  );
};

const SocialEngineeringNode = function SocialEngineeringNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Social Engineering"} icon={Users} color="#FF8C00" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-orange-500">{data.tool || 'SET'}</span>
      </div>
    </NodeWrapper>
  );
};

const AVBypassNode = function AVBypassNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "AV Bypass"} icon={Ghost} color="#8A2BE2" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-purple-500">{data.tool || 'Veil-Evasion'}</span>
      </div>
    </NodeWrapper>
  );
};

const PostExploitNode = function PostExploitNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Post Exploit"} icon={TerminalSquare} color="#32CD32" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-green-500">{data.tool || 'Meterpreter'}</span>
      </div>
    </NodeWrapper>
  );
};

const WirelessAttackerNode = function WirelessAttackerNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "Wireless Attacker"} icon={Wifi} color="#FFD700" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-yellow-500">{data.tool || 'Aircrack-ng'}</span>
      </div>
    </NodeWrapper>
  );
};

const OSINTNode = function OSINTNode({ data, selected }: any) {
  return (
    <NodeWrapper title={data.label || "OSINT"} icon={Search} color="#00F5FF" isVulnerable={data.isVulnerable} selected={selected}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flex justify-between">
        <span>Tool:</span>
        <span className="text-cyan-500">{data.tool || 'theHarvester'}</span>
      </div>
    </NodeWrapper>
  );
};

const nodeTypes = {
  userInput: InputNode,
  apiCall: APICallNode,
  dbQuery: DBQueryNode,
  auth: AuthNode,
  cache: CacheNode,
  cloud: CloudNode,
  terminal: TerminalNode,
  crawler: CrawlerNode,
  scanner: ScannerNode,
  fuzzer: FuzzerNode,
  exploit: ExploitNode,
  proxy: ProxyNode,
  reporter: ReporterNode,
  dirTraversal: DirTraversalNode,
  csrfTester: CSRFTesterNode,
  sslAnalyzer: SSLAnalyzerNode,
  logicFuzzer: LogicFuzzerNode,
  domXss: DOMXSSNode,
  subdomainEnum: SubdomainEnumNode,
  httpTamperer: HTTPTampererNode,
  sessionTester: SessionTesterNode,
  sniffer: SnifferNode,
  passwordCracker: PasswordCrackerNode,
  socialEngineering: SocialEngineeringNode,
  avBypass: AVBypassNode,
  postExploit: PostExploitNode,
  wirelessAttacker: WirelessAttackerNode,
  osint: OSINTNode,
};

const initialNodes: Node[] = [
  { 
    id: '1', 
    type: 'userInput', 
    data: { label: 'Input Node', isVulnerable: true, inputType: 'JSON', source: 'Web Client' }, 
    position: { x: 50, y: 150 } 
  },
  { 
    id: '2', 
    type: 'apiCall', 
    data: { label: 'API Node', isVulnerable: false, method: 'POST', endpoint: '/api/v1/auth' }, 
    position: { x: 350, y: 150 } 
  },
  { 
    id: '3', 
    type: 'dbQuery', 
    data: { label: 'DB Node', isVulnerable: true, table: 'users_meta', action: 'SELECT' }, 
    position: { x: 650, y: 150 } 
  },
  { 
    id: '4', 
    type: 'terminal', 
    data: { label: 'Output Node', isVulnerable: false, status: '200 OK', latency: '42ms' }, 
    position: { x: 950, y: 150 } 
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true,
    style: { stroke: '#00F5FF', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00F5FF' }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true,
    style: { stroke: '#A0AEC0', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4', 
    animated: true,
    style: { stroke: '#00FF00', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00FF00' }
  },
];

const SidebarItem = function SidebarItem({ type, icon: Icon, label, color }: any) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="glass p-3 rounded-xl border border-border-subtle cursor-grab active:cursor-grabbing hover:border-border-card transition-all group"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-surface group-hover:scale-110 transition-transform" style={{ color }}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-text-primary transition-colors">{label}</span>
      </div>
    </div>
  );
};

export const VisualTestBuilder = React.memo(function VisualTestBuilder({ onSaveTest, onExecuteTest, savedTests = [] }: { onSaveTest?: (test: any) => void, onExecuteTest?: (test: any) => void, savedTests?: any[] }) {
  const initialNodes = useMemo(() => [
    { 
      id: '1', 
      type: 'userInput', 
      data: { label: 'Input Node', isVulnerable: true, inputType: 'JSON', source: 'Web Client' }, 
      position: { x: 50, y: 150 } 
    },
    { 
      id: '2', 
      type: 'apiCall', 
      data: { label: 'API Node', isVulnerable: false, method: 'POST', endpoint: '/api/v1/auth' }, 
      position: { x: 350, y: 150 } 
    },
    { 
      id: '3', 
      type: 'dbQuery', 
      data: { label: 'DB Node', isVulnerable: true, table: 'users_meta', action: 'SELECT' }, 
      position: { x: 650, y: 150 } 
    },
    { 
      id: '4', 
      type: 'terminal', 
      data: { label: 'Output Node', isVulnerable: false, status: '200 OK', latency: '42ms' }, 
      position: { x: 950, y: 150 } 
    },
  ], []);

  const initialEdges = useMemo(() => [
    { 
      id: 'e1-2', 
      source: '1', 
      target: '2', 
      animated: true,
      style: { stroke: '#00F5FF', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00F5FF' }
    },
    { 
      id: 'e2-3', 
      source: '2', 
      target: '3', 
      animated: true,
      style: { stroke: '#A0AEC0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
    },
  ], []);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any[]);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
  }, []);
  const [showAttackVectors, setShowAttackVectors] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testName, setTestName] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProvider, setExportProvider] = useState<'github' | 'gitlab' | 'jenkins'>('github');
  const [exportedCode, setExportedCode] = useState("");

  // Text-to-Flow and Flow-to-Audit state
  const [flowPrompt, setFlowPrompt] = useState("User registers with email, gets an OTP via SMS, then uploads an avatar image");
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [isAuditingFlow, setIsAuditingFlow] = useState(false);
  const [flowAuditResult, setFlowAuditResult] = useState<any | null>(null);
  const [showFlowAuditModal, setShowFlowAuditModal] = useState(false);
  const [isNodeLibraryOpenMobile, setIsNodeLibraryOpenMobile] = useState(false);

  // Flow AI Conversational Attack Flow Planner & High-Severity Vulnerability Finder state
  const [showFlowChatDrawer, setShowFlowChatDrawer] = useState(false);
  const [showPatchModal, setShowPatchModal] = useState(false);
  const [patchFinding, setPatchFinding] = useState<any | null>(null);
  const [selectedPredefinedScenario, setSelectedPredefinedScenario] = useState<string>('');
  const [isChatboxExpanded, setIsChatboxExpanded] = useState<boolean>(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      if (file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setFlowPrompt(prev => {
              const prefix = prev.trim() ? `${prev}\n\n` : '';
              return `${prefix}[Context from ${file.name}]:\n${content.slice(0, 1200)}`;
            });
          }
        };
        reader.readAsText(file);
      } else {
        setFlowPrompt(prev => {
          const prefix = prev.trim() ? `${prev} ` : '';
          return `${prefix}[Attached Architecture Asset: ${file.name}]`;
        });
      }
    }
  };

  const handleApplyFlowFromChat = (newNodes: any[], newEdges: any[], summary?: string) => {
    if (newNodes && newNodes.length > 0) {
      setNodes(newNodes);
      setEdges(newEdges || []);
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2 });
      }, 150);
    }
  };

  const handleExecuteAttackFromChat = (newNodes: any[], newEdges: any[]) => {
    if (newNodes && newNodes.length > 0) {
      setNodes(newNodes);
      setEdges(newEdges || []);
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2 });
        runSimulation();
      }, 200);
    }
  };

  const handleOpenPatchModal = (finding: any) => {
    setPatchFinding(finding);
    setShowPatchModal(true);
  };

  const handleGenerateFlowFromPrompt = async (promptOverride?: string) => {
    const textToUse = promptOverride || flowPrompt;
    if (!textToUse.trim()) return;
    setIsGeneratingFlow(true);
    try {
      const res = await fetchFlowFromText(textToUse);
      if (res.nodes && res.nodes.length > 0) {
        setNodes(res.nodes);
        setEdges(res.edges || []);
        setTimeout(() => {
          reactFlowInstance?.fitView({ padding: 0.2 });
        }, 150);
      }
    } catch (e) {
      console.error("Failed to generate visual flow:", e);
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  const handleAuditFlowWithAdversarialPayloads = async () => {
    if (nodes.length === 0) return;
    setIsAuditingFlow(true);
    setShowFlowAuditModal(true);
    try {
      const res = await fetchAuditFlow(nodes, edges);
      setFlowAuditResult(res);

      // Update nodes on canvas to visually reflect vulnerability findings with vivid magenta borders
      if (Array.isArray(res.vulnerableNodeIds)) {
        setNodes(currentNodes =>
          currentNodes.map(node => {
            const isVuln = res.vulnerableNodeIds.includes(node.id);
            return {
              ...node,
              data: {
                ...node.data,
                isVulnerable: isVuln
              }
            };
          })
        );
      }
    } catch (e) {
      console.error("Failed to audit visual flow:", e);
    } finally {
      setIsAuditingFlow(false);
    }
  };


  const generateExportCode = (provider: 'github' | 'gitlab' | 'jenkins') => {
    const nodeTypes = nodes.map(n => n.type).join(', ');
    if (provider === 'github') {
      return `name: Sentinel Security Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Sentinel Security Tests
        uses: sentinel-ai/action@v1
        with:
          api-key: \${{ secrets.SENTINEL_API_KEY }}
          target: \${{ env.TARGET_URL }}
          flow-nodes: "${nodeTypes}"
          fail-on-critical: true`;
    } else if (provider === 'gitlab') {
      return `stages:
  - security

sentinel_scan:
  stage: security
  image: sentinel-ai/cli:latest
  script:
    - sentinel run-flow --nodes="${nodeTypes}" --target=$TARGET_URL
  variables:
    SENTINEL_API_KEY: $SENTINEL_API_KEY
  allow_failure: false`;
    } else {
      return `pipeline {
    agent any
    stages {
        stage('Security Scan') {
            steps {
                withCredentials([string(credentialsId: 'sentinel-api-key', variable: 'SENTINEL_API_KEY')]) {
                    sh 'sentinel run-flow --nodes="${nodeTypes}" --target=$TARGET_URL'
                }
            }
        }
    }
}`;
    }
  };

  useEffect(() => {
    if (showExportModal) {
      setExportedCode(generateExportCode(exportProvider));
    }
  }, [exportProvider, showExportModal, nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#A0AEC0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const defaultData: any = { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`, isVulnerable: false };
      
      if (type === 'crawler') {
        defaultData.engine = 'AI-driven deep scan';
        defaultData.depth = 3;
        defaultData.deepScanFlags = '--aggressive --ai-optimize';
        defaultData.label = 'AI Security Crawler';
      }

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: defaultData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const updateNodeData = (newData: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...newData } });
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleAutoConnect = useCallback(() => {
    const reconNodes = nodes.filter(n => ['userInput', 'crawler', 'scanner', 'subdomainEnum', 'osint', 'sniffer'].includes(n.type as string));
    const scanNodes = nodes.filter(n => ['fuzzer', 'dirTraversal', 'domXss', 'sslAnalyzer', 'apiCall', 'auth', 'dbQuery'].includes(n.type as string));
    const exploitNodes = nodes.filter(n => ['exploit', 'csrfTester', 'logicFuzzer', 'httpTamperer', 'sessionTester', 'passwordCracker', 'socialEngineering', 'avBypass', 'wirelessAttacker'].includes(n.type as string));
    const reportNodes = nodes.filter(n => ['reporter', 'terminal', 'postExploit'].includes(n.type as string));

    const newEdges: Edge[] = [];

    // Connect recon to scan
    reconNodes.forEach(r => {
      scanNodes.forEach(s => {
        newEdges.push({
          id: `e-${r.id}-${s.id}`,
          source: r.id,
          target: s.id,
          animated: true,
          style: { stroke: '#A0AEC0', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
        });
      });
    });

    // Connect scan to exploit
    scanNodes.forEach(s => {
      exploitNodes.forEach(e => {
        newEdges.push({
          id: `e-${s.id}-${e.id}`,
          source: s.id,
          target: e.id,
          animated: true,
          style: { stroke: '#A0AEC0', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
        });
      });
    });

    // Connect exploit to report
    exploitNodes.forEach(e => {
      reportNodes.forEach(rp => {
        newEdges.push({
          id: `e-${e.id}-${rp.id}`,
          source: e.id,
          target: rp.id,
          animated: true,
          style: { stroke: '#A0AEC0', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
        });
      });
    });

    // Fallback linear connection if no categories matched or to ensure connectivity
    if (newEdges.length === 0 && nodes.length > 1) {
       const sortedNodes = [...nodes].sort((a, b) => a.position.x - b.position.x);
       for(let i=0; i<sortedNodes.length - 1; i++) {
          newEdges.push({
             id: `e-fallback-${sortedNodes[i].id}-${sortedNodes[i+1].id}`,
             source: sortedNodes[i].id,
             target: sortedNodes[i+1].id,
             animated: true,
             style: { stroke: '#A0AEC0', strokeWidth: 2 },
             markerEnd: { type: MarkerType.ArrowClosed, color: '#A0AEC0' }
          });
       }
    }

    setEdges(newEdges);
  }, [nodes, setEdges]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, [setNodes, setEdges, setSelectedNode]);

  const [selectedScenario, setSelectedScenario] = useState('web');

  const handleGenerateScenario = useCallback(() => {
    let scenarioNodes: Node[] = [];
    
    if (selectedScenario === 'web') {
      scenarioNodes = [
        { id: 'n1', type: 'crawler', position: { x: 100, y: 100 }, data: { label: 'AI Security Crawler', tool: 'Crawler' } },
        { id: 'n2', type: 'osint', position: { x: 100, y: 250 }, data: { label: 'OSINT', tool: 'theHarvester' } },
        { id: 'n3', type: 'scanner', position: { x: 400, y: 100 }, data: { label: 'Web Scanner', tool: 'Nikto' } },
        { id: 'n4', type: 'scanner', position: { x: 400, y: 250 }, data: { label: 'Vuln Scanner', tool: 'w3af' } },
        { id: 'n5', type: 'domXss', position: { x: 400, y: 400 }, data: { label: 'DOM XSS', tool: 'DOM XSS' } },
        { id: 'n6', type: 'fuzzer', position: { x: 700, y: 100 }, data: { label: 'SQLi Tester', tool: 'SQLMap' } },
        { id: 'n7', type: 'proxy', position: { x: 700, y: 250 }, data: { label: 'Proxy', tool: 'Burp Suite' } },
        { id: 'n8', type: 'exploit', position: { x: 1000, y: 150 }, data: { label: 'Exploit', tool: 'Metasploit', payload: 'Reverse Shell' } },
        { id: 'n9', type: 'reporter', position: { x: 1300, y: 150 }, data: { label: 'Reporter', format: 'PDF' } },
      ];
    } else if (selectedScenario === 'network') {
      scenarioNodes = [
        { id: 'n1', type: 'osint', position: { x: 100, y: 100 }, data: { label: 'OSINT', tool: 'Maltego' } },
        { id: 'n2', type: 'sniffer', position: { x: 100, y: 250 }, data: { label: 'Network Sniffer', tool: 'Wireshark' } },
        { id: 'n3', type: 'scanner', position: { x: 400, y: 100 }, data: { label: 'Port Scanner', tool: 'Nmap' } },
        { id: 'n4', type: 'scanner', position: { x: 400, y: 250 }, data: { label: 'Vuln Scanner', tool: 'Nessus' } },
        { id: 'n5', type: 'exploit', position: { x: 700, y: 100 }, data: { label: 'Exploit', tool: 'Metasploit', payload: 'Reverse Shell' } },
        { id: 'n6', type: 'passwordCracker', position: { x: 700, y: 250 }, data: { label: 'Password Cracker', tool: 'Hydra' } },
        { id: 'n7', type: 'postExploit', position: { x: 1000, y: 100 }, data: { label: 'Post Exploit', tool: 'Meterpreter' } },
        { id: 'n8', type: 'reporter', position: { x: 1300, y: 100 }, data: { label: 'Reporter', format: 'PDF' } },
      ];
    } else if (selectedScenario === 'social') {
      scenarioNodes = [
        { id: 'n1', type: 'osint', position: { x: 100, y: 150 }, data: { label: 'OSINT', tool: 'theHarvester' } },
        { id: 'n2', type: 'socialEngineering', position: { x: 400, y: 100 }, data: { label: 'Phishing', tool: 'SET' } },
        { id: 'n3', type: 'socialEngineering', position: { x: 400, y: 250 }, data: { label: 'Browser Exploit', tool: 'BeEF' } },
        { id: 'n4', type: 'avBypass', position: { x: 700, y: 100 }, data: { label: 'AV Bypass', tool: 'Veil-Evasion' } },
        { id: 'n5', type: 'exploit', position: { x: 1000, y: 150 }, data: { label: 'Exploit', tool: 'Metasploit', payload: 'Reverse Shell' } },
        { id: 'n6', type: 'reporter', position: { x: 1300, y: 150 }, data: { label: 'Reporter', format: 'PDF' } },
      ];
    } else if (selectedScenario === 'wireless') {
      scenarioNodes = [
        { id: 'n1', type: 'sniffer', position: { x: 100, y: 150 }, data: { label: 'Network Sniffer', tool: 'Wireshark' } },
        { id: 'n2', type: 'wirelessAttacker', position: { x: 400, y: 100 }, data: { label: 'WPA/WEP Cracker', tool: 'Aircrack-ng' } },
        { id: 'n3', type: 'wirelessAttacker', position: { x: 400, y: 250 }, data: { label: 'WPS Cracker', tool: 'Bully' } },
        { id: 'n4', type: 'passwordCracker', position: { x: 700, y: 150 }, data: { label: 'Password Cracker', tool: 'John the Ripper' } },
        { id: 'n5', type: 'reporter', position: { x: 1000, y: 150 }, data: { label: 'Reporter', format: 'PDF' } },
      ];
    } else {
      scenarioNodes = [
        { id: 'n1', type: 'crawler', position: { x: 100, y: 100 }, data: { label: 'AI Security Crawler' } },
        { id: 'n2', type: 'subdomainEnum', position: { x: 100, y: 250 }, data: { label: 'Subdomain Enum' } },
        { id: 'n3', type: 'scanner', position: { x: 400, y: 100 }, data: { label: 'Scanner (Nmap/ZAP)' } },
        { id: 'n4', type: 'dirTraversal', position: { x: 400, y: 250 }, data: { label: 'Dir Traversal' } },
        { id: 'n5', type: 'domXss', position: { x: 400, y: 400 }, data: { label: 'DOM XSS' } },
        { id: 'n6', type: 'sslAnalyzer', position: { x: 400, y: 550 }, data: { label: 'SSL/TLS Analyzer' } },
        { id: 'n7', type: 'fuzzer', position: { x: 700, y: 100 }, data: { label: 'Fuzzer (SQLMap/Ffuf)' } },
        { id: 'n8', type: 'csrfTester', position: { x: 700, y: 250 }, data: { label: 'CSRF Tester' } },
        { id: 'n9', type: 'logicFuzzer', position: { x: 700, y: 400 }, data: { label: 'Logic Fuzzer' } },
        { id: 'n10', type: 'httpTamperer', position: { x: 700, y: 550 }, data: { label: 'HTTP Tamperer' } },
        { id: 'n11', type: 'sessionTester', position: { x: 700, y: 700 }, data: { label: 'Session Tester' } },
        { id: 'n12', type: 'exploit', position: { x: 1000, y: 300 }, data: { label: 'Exploit (Metasploit)' } },
        { id: 'n13', type: 'reporter', position: { x: 1300, y: 300 }, data: { label: 'Reporter' } },
      ];
    }
    setNodes(scenarioNodes);
    
    setTimeout(() => {
      handleAutoConnect();
    }, 100);
  }, [setNodes, handleAutoConnect, selectedScenario]);

  const runSimulation = () => {
    console.log("runSimulation called with nodes:", nodesRef.current, "and edges:", edgesRef.current);
    setIsExecuting(true);
    setExecutionProgress(0);
    setExecutionLogs(["Initializing mission...", "Parsing visual flow graph..."]);
    
    const logs = [
      "Connecting to target endpoints...",
      "Executing Crawler: Crawl4AI mode selected.",
      "Scanning for open ports with Nmap...",
      "Fuzzing parameters for SQL injection...",
      "Analyzing data lineage for PII leaks...",
      "Validating authentication tokens...",
      "Generating security report..."
    ];

    let logIdx = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      
      if (progress >= 100) {
        clearInterval(interval);
        setExecutionProgress(100);
        
        // Move side effects to a timeout or handle them after the state update
        setTimeout(() => {
          setExecutionLogs(prevLogs => [...prevLogs, "Mission completed successfully.", "Report generated."]);
          
          if (onExecuteTest) {
            const testCase = {
              title: `Visual Execution ${new Date().toLocaleTimeString()}`,
              nodes: nodesRef.current.map(n => ({ type: n.type, label: n.data.label, isVulnerable: n.data.isVulnerable })),
              edges: edgesRef.current.length,
              status: 'Completed',
              timestamp: new Date().toISOString()
            };
            onExecuteTest(testCase);
          }
          
          setTimeout(() => setIsExecuting(false), 2000);
        }, 0);
        return;
      }

      setExecutionProgress(progress);
      
      if (progress % 15 === 0 && logIdx < logs.length) {
        const currentLog = logs[logIdx];
        setExecutionLogs(prevLogs => [...prevLogs, currentLog]);
        logIdx++;
      }
    }, 100);
  };

  const toggleAttackVectors = () => {
    setShowAttackVectors(!showAttackVectors);
    setEdges((eds) => 
      eds.map((edge) => ({
        ...edge,
        animated: true,
        style: { 
          ...edge.style, 
          stroke: !showAttackVectors ? '#FF007A' : '#A0AEC0',
          strokeWidth: !showAttackVectors ? 4 : 2,
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed,
          color: !showAttackVectors ? '#FF007A' : '#A0AEC0' 
        }
      }))
    );
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-hidden p-2">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
        <div className="glass p-3 lg:p-6 rounded-3xl border border-border-subtle flex flex-col lg:h-full max-h-[40vh] lg:max-h-full">
          <button
            onClick={() => setIsNodeLibraryOpenMobile(!isNodeLibraryOpenMobile)}
            className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center justify-between w-full lg:mb-4 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus size={14} className="text-neon-cyan" />
              Node Library
            </span>
            <span className="lg:hidden text-[10px] text-text-muted font-bold flex items-center gap-1">
              {isNodeLibraryOpenMobile ? 'Hide' : 'Show'}
              <ChevronDown size={14} className={`transition-transform duration-200 ${isNodeLibraryOpenMobile ? 'rotate-180' : ''}`} />
            </span>
          </button>
          <div className={`${isNodeLibraryOpenMobile ? 'block mt-3' : 'hidden'} lg:block space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent`}>
            <SidebarItem type="userInput" icon={MousePointer2} label="User Input" color="#00F5FF" />
            <SidebarItem type="apiCall" icon={Globe} label="API Request" color="#A0AEC0" />
            <SidebarItem type="auth" icon={Lock} label="Auth Guard" color="#FFD700" />
            <SidebarItem type="dbQuery" icon={Database} label="DB Query" color="#00FF00" />
            
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-4 mb-2 opacity-50">Security Tools</div>
            <SidebarItem type="osint" icon={Search} label="OSINT" color="#00F5FF" />
            <SidebarItem type="crawler" icon={Search} label="AI Security Crawler" color="#00F5FF" />
            <SidebarItem type="scanner" icon={Crosshair} label="Scanner (Nmap/ZAP)" color="#FF007A" />
            <SidebarItem type="dirTraversal" icon={FolderOpen} label="Dir Traversal" color="#FF8C00" />
            <SidebarItem type="csrfTester" icon={ShieldAlert} label="CSRF Tester" color="#FF1493" />
            <SidebarItem type="sslAnalyzer" icon={LockKeyhole} label="SSL/TLS Analyzer" color="#00CED1" />
            <SidebarItem type="logicFuzzer" icon={Cpu} label="Logic Fuzzer" color="#4B0082" />
            <SidebarItem type="domXss" icon={FileCode2} label="DOM XSS" color="#32CD32" />
            <SidebarItem type="subdomainEnum" icon={Search} label="Subdomain Enum" color="#00BFFF" />
            <SidebarItem type="httpTamperer" icon={FileWarning} label="HTTP Tamperer" color="#DC143C" />
            <SidebarItem type="sessionTester" icon={KeyRound} label="Session Tester" color="#8A2BE2" />
            <SidebarItem type="sniffer" icon={Eye} label="Network Sniffer" color="#00BFFF" />
            <SidebarItem type="passwordCracker" icon={KeyRound} label="Password Cracker" color="#FF4500" />
            <SidebarItem type="socialEngineering" icon={Users} label="Social Engineering" color="#FF8C00" />
            <SidebarItem type="avBypass" icon={Ghost} label="AV Bypass" color="#8A2BE2" />
            <SidebarItem type="wirelessAttacker" icon={Wifi} label="Wireless Attacker" color="#FFD700" />
            
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-4 mb-2 opacity-50">Exploitation</div>
            <SidebarItem type="proxy" icon={Shield} label="Proxy (Burp/ZAP)" color="#A0AEC0" />
            <SidebarItem type="fuzzer" icon={Bug} label="Fuzzer (SQLMap/Ffuf)" color="#FFD700" />
            <SidebarItem type="exploit" icon={Zap} label="Exploit (Metasploit)" color="#FF0000" />
            <SidebarItem type="postExploit" icon={TerminalSquare} label="Post Exploit" color="#32CD32" />
            
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-4 mb-2 opacity-50">Infrastructure</div>
            <SidebarItem type="cache" icon={Cpu} label="Cache Layer" color="#FF8C00" />
            <SidebarItem type="cloud" icon={Cloud} label="External API" color="#1E90FF" />
            
            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-4 mb-2 opacity-50">Reporting</div>
            <SidebarItem type="reporter" icon={FileSearch} label="Reporter" color="#00FF00" />
            <SidebarItem type="terminal" icon={Terminal} label="Terminal Output" color="#A0AEC0" />
          </div>
        </div>
      </div>

      {/* Main Builder */}
      <div className="flex-1 glass relative overflow-hidden rounded-3xl border border-border-subtle min-h-[600px] flex flex-col">
        {/* Dedicated Non-Overlapping Header & Controls Toolbar */}
        <div className="border-b border-border-subtle bg-deep-space/80 backdrop-blur-xl p-3 lg:p-4 shrink-0 flex flex-col gap-3 z-10">
          {/* Row 1: Title & Main Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Info */}
            <div className="flex items-center gap-3 shrink-0">
              <h3 className="text-sm lg:text-base font-black tracking-tighter text-text-primary flex items-center gap-2">
                <Zap className="text-neon-cyan" size={16} />
                VISUAL TEST BUILDER
              </h3>
              <div className="group/help relative">
                <Info size={13} className="text-text-muted hover:text-neon-cyan cursor-help" />
                <div className="absolute left-0 top-full mt-2 w-56 lg:w-64 p-3 bg-deep-space border border-border-subtle rounded-xl text-[9px] lg:text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/help:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                  Design and visualize security test flows. Connect nodes to map data lineage and identify potential attack vectors.
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearCanvas}
                  disabled={isExecuting}
                  className="px-2.5 py-1.5 lg:px-3 lg:py-2 bg-surface border border-border-subtle text-text-muted rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
                  title="Clear Canvas"
                >
                  <Trash2 size={12} />
                  Clear
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAutoConnect}
                  disabled={isExecuting}
                  className="px-2.5 py-1.5 lg:px-3 lg:py-2 bg-surface border border-neon-cyan/50 text-neon-cyan rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-neon-cyan/10 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Auto Connect"
                >
                  <Plus size={12} />
                  Auto Connect
                </motion.button>

                <div className="flex items-center gap-1.5">
                  <select 
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="px-2 py-1.5 lg:px-2.5 lg:py-2 bg-surface border border-vivid-magenta/50 text-vivid-magenta rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest outline-none"
                  >
                    <option value="web">Web App Pentest</option>
                    <option value="network">Network Pentest</option>
                    <option value="social">Social Engineering</option>
                    <option value="wireless">Wireless Pentest</option>
                    <option value="full">Full Assessment</option>
                  </select>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateScenario}
                    disabled={isExecuting}
                    className="px-2.5 py-1.5 lg:px-3 lg:py-2 bg-surface border border-vivid-magenta/50 text-vivid-magenta rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-vivid-magenta/10 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Generate Scenario"
                  >
                    <Database size={12} />
                    Generate Scenario
                  </motion.button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runSimulation}
                disabled={isExecuting}
                className="px-3.5 py-1.5 lg:px-5 lg:py-2 bg-neon-cyan text-deep-space rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-neon-cyan/20 disabled:opacity-50 cursor-pointer"
              >
                <Play size={12} fill="currentColor" />
                {isExecuting ? '...' : 'Execute'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAuditFlowWithAdversarialPayloads}
                disabled={isAuditingFlow || isExecuting || nodes.length === 0}
                className="px-3.5 py-1.5 lg:px-5 lg:py-2 bg-vivid-magenta text-white rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-vivid-magenta/20 disabled:opacity-50 cursor-pointer"
                title="Inject adversarial payloads across nodes sequentially"
              >
                <ShieldAlert size={12} />
                {isAuditingFlow ? 'Auditing...' : 'Audit Flow'}
              </motion.button>

              <div className="h-4 lg:h-6 w-px bg-border-subtle mx-0.5" />

              <div className="relative">
                {isSaving ? (
                  <div className="absolute right-0 top-0 bg-surface border border-border-subtle rounded-xl p-2 flex items-center gap-2 shadow-2xl z-50 min-w-[200px] lg:min-w-[250px]">
                    <input 
                      type="text" 
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Test Name"
                      className="flex-1 bg-deep-space border border-border-subtle rounded-lg px-2 py-1 text-[9px] lg:text-[10px] text-text-primary focus:outline-none focus:border-neon-cyan"
                      autoFocus
                    />
                    <button 
                      onClick={() => setIsSaving(false)}
                      className="p-1 text-text-muted hover:text-text-primary"
                    >
                      <X size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        if (onSaveTest && testName.trim()) {
                          const testCase = {
                            title: testName.trim(),
                            nodes: nodes.map(n => ({ type: n.type, label: n.data.label, isVulnerable: n.data.isVulnerable })),
                            edges: edges.length,
                            expected: { status: 200, latency: "< 100ms" },
                            actual: { 
                              status: nodes.some(n => n.data.isVulnerable) ? 403 : 200, 
                              latency: `${Math.floor(Math.random() * 50) + 20}ms` 
                            },
                            deviation: nodes.some(n => n.data.isVulnerable) ? 75 : 0,
                            recommendation: nodes.some(n => n.data.isVulnerable) 
                              ? "Vulnerability detected in flow. Check unvalidated input or SQL injection points."
                              : "Flow is secure according to visual model.",
                            graphData: { nodes, edges }
                          };
                          onSaveTest(testCase);
                          setIsSaving(false);
                        }
                      }}
                      className="px-2 py-1 lg:px-3 lg:py-1 bg-neon-cyan text-deep-space rounded-lg text-[9px] lg:text-[10px] font-black uppercase cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTestName(`Visual Test ${new Date().toLocaleTimeString()}`);
                      setIsSaving(true);
                    }}
                    className="p-1.5 lg:p-2 bg-surface border border-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-all cursor-pointer"
                    title="Save Test Flow"
                  >
                    <Save size={12} />
                  </motion.button>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleAttackVectors}
                className={`p-1.5 lg:p-2 rounded-xl transition-all border cursor-pointer ${showAttackVectors ? 'bg-vivid-magenta/10 border-vivid-magenta text-vivid-magenta neon-glow-magenta' : 'bg-surface border-border-subtle text-text-muted hover:text-text-primary'}`}
                title={showAttackVectors ? 'Hide Attack Vectors' : 'Show Attack Vectors'}
              >
                <AlertTriangle size={12} />
              </motion.button>

              <div className="flex items-center gap-1">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLoadMenu(!showLoadMenu)}
                    className="p-1.5 lg:p-2 bg-surface border border-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-all cursor-pointer"
                    title="Load Test Case"
                  >
                    <FolderOpen size={12} />
                  </motion.button>
                  <AnimatePresence>
                    {showLoadMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 bg-deep-space border border-border-subtle rounded-xl overflow-hidden z-50 shadow-2xl min-w-[180px] lg:min-w-[200px]"
                      >
                        {savedTests.length === 0 ? (
                          <div className="p-4 text-[9px] lg:text-[10px] text-text-muted text-center uppercase font-bold">No saved tests</div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            {savedTests.map((test, idx) => (
                              <button
                                key={test.id || idx}
                                onClick={() => {
                                  if (test.graphData) {
                                    setNodes(test.graphData.nodes || []);
                                    setEdges(test.graphData.edges || []);
                                  }
                                  setShowLoadMenu(false);
                                }}
                                className="w-full text-left px-4 py-3 text-[9px] lg:text-[10px] font-bold text-text-primary hover:bg-surface-hover border-b border-border-subtle last:border-0 transition-colors uppercase tracking-widest cursor-pointer"
                              >
                                {test.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportModal(true)}
                  className="p-1.5 lg:p-2 bg-surface border border-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-all cursor-pointer"
                  title="Export CI/CD"
                >
                  <Code size={12} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Row 2: Flow AI Multi-Agent Attack Planner & Dynamic Graph Synthesizer */}
          <div className="bg-surface/75 border border-neon-cyan/30 rounded-2xl p-3 lg:p-3.5 flex flex-col gap-2.5 shadow-xl shadow-deep-space/60 backdrop-blur-md">
            {/* Tier 1: Header / Scenario Bar & Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-subtle/50">
              {/* Left: Flow AI Brand & Engine Pill */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-neon-cyan">
                  <Sparkles size={14} className="text-neon-cyan animate-pulse" />
                  <span>Flow AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neon-cyan font-mono px-2.5 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center gap-1.5 shadow-sm shadow-neon-cyan/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-ping" />
                    Gemini 3.1 Pro
                  </span>
                  <span className="hidden sm:inline-flex text-[9px] text-text-muted font-mono uppercase px-2 py-0.5 rounded-md bg-deep-space/60 border border-border-subtle">
                    Autonomous AppSec Planner
                  </span>
                </div>
              </div>

              {/* Right: Dynamic Predefined Scenario Selector & Tools */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider hidden md:inline shrink-0">
                  Scenario:
                </label>
                <select
                  value={selectedPredefinedScenario}
                  onChange={(e) => {
                    const key = e.target.value;
                    setSelectedPredefinedScenario(key);
                    const found = PREDEFINED_SCENARIOS.find(s => s.key === key);
                    if (found) {
                      setFlowPrompt(found.prompt);
                    }
                  }}
                  className="h-8 bg-deep-space/80 border border-border-subtle rounded-xl px-2.5 text-xs text-text-primary outline-none focus:border-neon-cyan transition-colors cursor-pointer text-ellipsis max-w-[200px] sm:max-w-[270px]"
                >
                  <option value="">⚡ Custom Attack / Dynamic Flow...</option>
                  {PREDEFINED_SCENARIOS.map((sc) => (
                    <option key={sc.key} value={sc.key}>
                      [{sc.severity} {sc.cvss}] {sc.label}
                    </option>
                  ))}
                </select>

                {/* Expand/Collapse Chatbox Composer Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChatboxExpanded(!isChatboxExpanded)}
                  className="h-8 px-2.5 bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary border border-border-subtle rounded-xl text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={isChatboxExpanded ? "Collapse to single-line prompt" : "Expand multi-line attack composer"}
                >
                  {isChatboxExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span className="hidden lg:inline">{isChatboxExpanded ? 'Compact' : 'Expand'}</span>
                </button>

                {/* Clear Button */}
                {flowPrompt.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setFlowPrompt('');
                      setSelectedPredefinedScenario('');
                      setAttachedFileName(null);
                    }}
                    className="h-8 px-2 text-[10px] text-text-muted hover:text-rose-400 hover:bg-rose-500/10 border border-border-subtle hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                    title="Clear prompt"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Tier 2: Dedicated, Full-Width Dynamic Chatbox & Action Buttons */}
            <div className="w-full">
              {isChatboxExpanded ? (
                /* Multi-line Expanded Attack Spec Composer */
                <div className="flex flex-col gap-2.5 bg-deep-space/85 border border-neon-cyan/40 rounded-2xl p-3 shadow-inner">
                  <textarea
                    rows={3}
                    value={flowPrompt}
                    onChange={(e) => setFlowPrompt(e.target.value)}
                    placeholder="Describe an attack or target flow: e.g. OAuth 2.0 Account Takeover with redirect_uri injection, state bypassing, and JWT token theft..."
                    className="w-full bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-muted/60 outline-none resize-none font-mono leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle/50">
                    <div className="flex items-center gap-2">
                      {/* Attachment chip */}
                      {attachedFileName && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 text-xs font-mono">
                          <Paperclip size={12} />
                          <span className="max-w-[140px] truncate">{attachedFileName}</span>
                          <button
                            type="button"
                            onClick={() => setAttachedFileName(null)}
                            className="hover:text-white transition-colors cursor-pointer ml-1"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-text-muted font-mono hidden sm:inline">
                        Multi-line attack definition & OpenAPI context
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Attach button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-3 border border-border-subtle hover:border-neon-cyan/50 bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Attach architectural diagram, OpenAPI spec, or context file"
                      >
                        <Paperclip size={14} />
                        <span>{attachedFileName ? 'Change' : 'Attach'}</span>
                      </button>
                      {/* AI Attack Chat button */}
                      <button
                        type="button"
                        onClick={() => setShowFlowChatDrawer(true)}
                        className="h-9 px-4 bg-gradient-to-r from-vivid-magenta to-pink-600 hover:from-pink-500 hover:to-pink-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-vivid-magenta/30 border border-vivid-magenta/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        title="Open conversational attack planning & vulnerability chat"
                      >
                        <Bot size={15} />
                        <span>AI Attack Chat</span>
                      </button>
                      {/* Generate Graph button */}
                      <button
                        type="button"
                        onClick={() => handleGenerateFlowFromPrompt()}
                        disabled={isGeneratingFlow || !flowPrompt.trim()}
                        className="h-9 px-4 bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/50 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm shadow-neon-cyan/20 hover:scale-[1.02] active:scale-[0.98]"
                        title="Generate graph directly on canvas"
                      >
                        <Sparkles size={14} />
                        <span>{isGeneratingFlow ? 'Synthesizing...' : 'Generate Graph'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Single-line Spacious Full-Width Chatbox Row */
                <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                  {/* Full-width Input container */}
                  <div className="flex-1 min-w-0 h-11 bg-deep-space/85 border border-border-subtle focus-within:border-neon-cyan focus-within:shadow-[0_0_15px_rgba(0,243,255,0.15)] rounded-2xl px-3.5 flex items-center gap-2.5 transition-all">
                    <div className="p-1.5 rounded-lg bg-neon-cyan/10 text-neon-cyan shrink-0">
                      <Bot size={16} />
                    </div>
                    <input
                      type="text"
                      value={flowPrompt}
                      onChange={(e) => setFlowPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.metaKey || e.ctrlKey) {
                            handleGenerateFlowFromPrompt();
                          } else {
                            setShowFlowChatDrawer(true);
                          }
                        }
                      }}
                      placeholder="Describe attack flow or test scenario (e.g. OAuth 2.0 Account Takeover with token theft)..."
                      className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-muted/60 outline-none h-full font-medium"
                    />

                    {/* Inline Attachment Pill */}
                    {attachedFileName && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 text-[11px] font-mono shrink-0">
                        <Paperclip size={12} />
                        <span className="max-w-[110px] truncate">{attachedFileName}</span>
                        <button
                          type="button"
                          onClick={() => setAttachedFileName(null)}
                          className="hover:text-white transition-colors cursor-pointer ml-1"
                          title="Remove attachment"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}

                    {/* Quick Clear icon if has text */}
                    {flowPrompt.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setFlowPrompt('');
                          setSelectedPredefinedScenario('');
                        }}
                        className="text-text-muted hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Clear input"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Keyboard hint on desktop */}
                    <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-text-muted font-mono shrink-0 border-l border-border-subtle/50 pl-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle">↵ Chat</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle">⌘↵ Graph</span>
                    </div>
                  </div>

                  {/* Action Buttons Group - Always aligned and never squished */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {/* Attach Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-11 px-3.5 border rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                        attachedFileName 
                          ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan shadow-sm shadow-neon-cyan/20' 
                          : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border-border-subtle hover:border-text-muted/50'
                      }`}
                      title="Attach architectural diagram, OpenAPI spec, or context file"
                    >
                      <Paperclip size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">{attachedFileName ? 'Attached' : 'Attach'}</span>
                    </button>

                    {/* AI Attack Chat Button */}
                    <button
                      type="button"
                      onClick={() => setShowFlowChatDrawer(true)}
                      className="h-11 px-4 bg-gradient-to-r from-vivid-magenta to-pink-600 hover:from-pink-500 hover:to-pink-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-vivid-magenta/30 border border-vivid-magenta/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      title="Open conversational attack planning & vulnerability chat"
                    >
                      <Bot size={15} className="shrink-0" />
                      <span className="whitespace-nowrap">AI Attack Chat</span>
                    </button>

                    {/* Generate Graph Button */}
                    <button
                      type="button"
                      onClick={() => handleGenerateFlowFromPrompt()}
                      disabled={isGeneratingFlow || !flowPrompt.trim()}
                      className="h-11 px-4 bg-surface hover:bg-surface-hover text-neon-cyan border border-neon-cyan/40 hover:border-neon-cyan font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                      title="Generate graph directly on canvas"
                    >
                      <Sparkles size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">{isGeneratingFlow ? 'Synthesizing...' : 'Generate Graph'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.yaml,.yml,.txt,.png,.jpg,.jpeg,.svg,.pdf"
              className="hidden"
              onChange={handleFileAttach}
            />

            {/* Tier 3: Predefined Dynamic Attack Scenarios Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin text-[10px] pt-1.5 border-t border-border-subtle/50">
              <span className="text-text-muted font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Flame size={12} className="text-vivid-magenta" />
                <span>Attack Scenarios:</span>
              </span>
              {PREDEFINED_SCENARIOS.map((sc) => {
                const isSelected = selectedPredefinedScenario === sc.key;
                return (
                  <button
                    key={sc.key}
                    onClick={() => {
                      setFlowPrompt(sc.prompt);
                      setSelectedPredefinedScenario(sc.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl border shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-neon-cyan/15 border-neon-cyan text-neon-cyan shadow-sm shadow-neon-cyan/20'
                        : 'bg-surface/80 hover:bg-neon-cyan/10 text-text-secondary hover:text-neon-cyan border-border-subtle hover:border-neon-cyan/50'
                    }`}
                    title={sc.shortDesc}
                  >
                    <span className="font-semibold">{sc.label}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                      sc.severity === 'Critical' ? 'bg-vivid-magenta/20 text-vivid-magenta border border-vivid-magenta/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {sc.severity} {sc.cvss}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative w-full h-full min-h-[480px]" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background color="var(--border-subtle)" gap={20} />
            <Controls showInteractive={false} position="bottom-right" className="mb-14 mr-2 lg:mb-16 lg:mr-4" />

          {isExecuting && (
            <Panel position="bottom-left" className="ml-2 mb-2 lg:ml-4 lg:mb-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-3 lg:p-4 rounded-2xl border border-border-subtle w-64 lg:w-80 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] lg:text-[9px] font-black text-text-muted uppercase tracking-widest">
                    <span>Progress</span>
                    <span>{executionProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${executionProgress}%` }}
                      className="h-full bg-neon-cyan neon-glow-cyan"
                    />
                  </div>
                </div>
                
                <div className="bg-deep-space/50 rounded-xl p-2 lg:p-3 border border-border-subtle h-24 lg:h-32 overflow-y-auto font-mono text-[7px] lg:text-[8px] space-y-1 scrollbar-hide">
                  {executionLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-neon-cyan opacity-50">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                      <span className="text-text-primary">{log}</span>
                    </div>
                  ))}
                  <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
              </motion.div>
            </Panel>
          )}

          {!isExecuting && (
            <Panel position="bottom-right" className="mb-2 mr-2 lg:mb-4 lg:mr-4">
              <div className="glass px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-neon-cyan neon-glow-cyan" />
                  <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase">Input</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-vivid-magenta neon-glow-magenta" />
                  <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase">Risk</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-lime-green neon-glow-green" />
                  <span className="text-[8px] lg:text-[10px] font-bold text-text-muted uppercase">Success</span>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
        </div>
      </div>

      {/* Config Panel */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <div 
              className="fixed inset-0 bg-deep-space/60 backdrop-blur-sm z-40 lg:hidden" 
              onClick={() => setSelectedNode(null)} 
            />
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed lg:relative right-2 sm:right-4 bottom-2 sm:bottom-4 lg:right-0 lg:top-0 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-96 lg:w-80 max-h-[82vh] lg:max-h-full overflow-y-auto glass rounded-3xl border border-neon-cyan/40 lg:border-border-subtle p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 z-50 lg:z-0 shadow-2xl lg:shadow-none scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent"
            >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={14} className="text-neon-cyan" />
                Node Config
              </h4>
              <button onClick={() => setSelectedNode(null)} className="text-text-muted hover:text-text-primary transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Node Label</label>
                <input 
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeData({ label: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary focus:ring-2 focus:ring-neon-cyan outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-subtle">
                <div className="flex items-center gap-3">
                  <Shield size={16} className={selectedNode.data.isVulnerable ? 'text-vivid-magenta' : 'text-text-muted'} />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Vulnerable</span>
                </div>
                <button 
                  onClick={() => updateNodeData({ isVulnerable: !selectedNode.data.isVulnerable })}
                  className={`w-10 h-5 rounded-full relative transition-all ${selectedNode.data.isVulnerable ? 'bg-vivid-magenta' : 'bg-surface-hover'}`}
                >
                  <motion.div 
                    animate={{ x: selectedNode.data.isVulnerable ? 20 : 2 }}
                    className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full"
                  />
                </button>
              </div>

              {/* Dynamic Fields based on type */}
              {selectedNode.type === 'crawler' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Engine</label>
                    <select 
                      value={selectedNode.data.engine || 'Crawl4AI'}
                      onChange={(e) => updateNodeData({ engine: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Crawl4AI">Crawl4AI</option>
                      <option value="Scrapy">Scrapy</option>
                      <option value="AI-driven deep scan">AI-driven deep scan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Depth</label>
                    <input 
                      type="number"
                      value={selectedNode.data.depth || 2}
                      onChange={(e) => updateNodeData({ depth: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Parameters</label>
                    <input 
                      type="text"
                      value={selectedNode.data.parameters || ''}
                      onChange={(e) => updateNodeData({ parameters: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                      placeholder="e.g. --ignore-robots"
                    />
                  </div>
                  {selectedNode.data.engine === 'AI-driven deep scan' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Deep Scan Flags</label>
                      <input 
                        type="text"
                        value={selectedNode.data.deepScanFlags || ''}
                        onChange={(e) => updateNodeData({ deepScanFlags: e.target.value })}
                        className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                        placeholder="e.g. --aggressive"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'osint' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'theHarvester'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="theHarvester">theHarvester</option>
                      <option value="Maltego">Maltego</option>
                      <option value="Netcraft">Netcraft</option>
                      <option value="Whois">Whois</option>
                      <option value="Nslookup">Nslookup / Host</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'scanner' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Nmap'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Nmap">Nmap</option>
                      <option value="Nessus">Nessus</option>
                      <option value="OWASP ZAP">OWASP ZAP</option>
                      <option value="Nikto">Nikto</option>
                      <option value="w3af">w3af</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Target</label>
                    <input 
                      type="text"
                      value={selectedNode.data.target || ''}
                      onChange={(e) => updateNodeData({ target: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                      placeholder="localhost"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'fuzzer' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'SQLMap'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="SQLMap">SQLMap</option>
                      <option value="Ffuf">Ffuf</option>
                      <option value="Dirb">Dirb</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'proxy' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Burp Suite'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Burp Suite">Burp Suite</option>
                      <option value="OWASP ZAP">OWASP ZAP</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'exploit' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Payload</label>
                    <select 
                      value={selectedNode.data.payload || 'Reverse Shell'}
                      onChange={(e) => updateNodeData({ payload: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Reverse Shell">Reverse Shell</option>
                      <option value="Privilege Escalation">Privilege Escalation</option>
                      <option value="RCE">RCE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Metasploit'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Metasploit">Metasploit</option>
                      <option value="Cadaver">Cadaver</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'sniffer' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Wireshark'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Wireshark">Wireshark</option>
                      <option value="Arpspoof">Arpspoof</option>
                      <option value="Dnsspoof">Dnsspoof</option>
                      <option value="Ettercap">Ettercap</option>
                      <option value="SSLstrip">SSLstrip</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'passwordCracker' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'John the Ripper'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="John the Ripper">John the Ripper</option>
                      <option value="Hydra">Hydra</option>
                      <option value="WCE">Windows Credential Editor (WCE)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'socialEngineering' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'SET'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="SET">Social-Engineer Toolkit (SET)</option>
                      <option value="BeEF">Browser Exploitation Framework (BeEF)</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'avBypass' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Veil-Evasion'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Veil-Evasion">Veil-Evasion</option>
                      <option value="Msfvenom">Msfvenom</option>
                      <option value="Hyperion">Hyperion</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'postExploit' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Meterpreter'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Meterpreter">Meterpreter</option>
                      <option value="PSExec">PSExec</option>
                      <option value="SSHExec">SSHExec</option>
                      <option value="Incognito">Incognito</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'wirelessAttacker' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tool</label>
                    <select 
                      value={selectedNode.data.tool || 'Aircrack-ng'}
                      onChange={(e) => updateNodeData({ tool: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="Aircrack-ng">Aircrack-ng</option>
                      <option value="Bully">Bully</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'reporter' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Format</label>
                    <select 
                      value={selectedNode.data.format || 'PDF'}
                      onChange={(e) => updateNodeData({ format: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="PDF">PDF</option>
                      <option value="JSON">JSON</option>
                      <option value="HTML">HTML</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedNode.type === 'apiCall' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Method</label>
                    <select 
                      value={selectedNode.data.method}
                      onChange={(e) => updateNodeData({ method: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Endpoint</label>
                    <input 
                      type="text"
                      value={selectedNode.data.endpoint}
                      onChange={(e) => updateNodeData({ endpoint: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'dbQuery' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Table</label>
                    <input 
                      type="text"
                      value={selectedNode.data.table}
                      onChange={(e) => updateNodeData({ table: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto">
              <button 
                onClick={deleteNode}
                className="w-full py-3 bg-vivid-magenta/10 text-vivid-magenta border border-vivid-magenta/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-vivid-magenta/20 transition-all"
              >
                <Trash2 size={14} />
                Delete Node
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {showExportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border-subtle rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-hover"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tighter mb-2 pr-8 flex items-center gap-3">
                <Code className="text-neon-cyan shrink-0" />
                Export CI/CD Pipeline
              </h3>
              <p className="text-xs text-text-muted mb-4 sm:mb-6">Integrate this security test flow directly into your deployment pipeline.</p>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                {(['github', 'gitlab', 'jenkins'] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => setExportProvider(provider)}
                    className={`flex-1 min-w-[100px] py-2.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${exportProvider === provider ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan' : 'bg-deep-space border-border-subtle text-text-muted hover:border-text-muted'}`}
                  >
                    {provider === 'github' ? 'GitHub Actions' : provider === 'gitlab' ? 'GitLab CI' : 'Jenkins'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute top-0 right-0 p-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(exportedCode)}
                    className="p-2 bg-surface hover:bg-surface-hover rounded-lg text-text-muted hover:text-neon-cyan transition-colors border border-border-subtle"
                    title="Copy to clipboard"
                  >
                    <Download size={14} />
                  </button>
                </div>
                <pre className="bg-deep-space border border-border-subtle rounded-xl p-4 overflow-x-auto text-xs font-mono text-text-secondary h-64 scrollbar-thin scrollbar-thumb-surface scrollbar-track-transparent">
                  <code>{exportedCode}</code>
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FlowAuditModal
        isOpen={showFlowAuditModal}
        onClose={() => setShowFlowAuditModal(false)}
        auditResult={flowAuditResult}
        isLoading={isAuditingFlow}
      />

      <FlowAIChatDrawer
        isOpen={showFlowChatDrawer}
        onClose={() => setShowFlowChatDrawer(false)}
        onApplyFlow={handleApplyFlowFromChat}
        onExecuteFlow={handleExecuteAttackFromChat}
        onOpenPatch={handleOpenPatchModal}
        initialPrompt={flowPrompt}
        currentNodes={nodes}
        currentEdges={edges}
      />

      <PatchModal
        isOpen={showPatchModal}
        onClose={() => {
          setShowPatchModal(false);
          setPatchFinding(null);
        }}
        finding={patchFinding}
      />
    </div>
  );
});
