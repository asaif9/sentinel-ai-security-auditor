import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Zap, 
  Target, 
  Search, 
  Info, 
  History, 
  ArrowUpRight, 
  ShieldAlert,
  Clock,
  Filter,
  Download
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DeviationCard = ({ title, data, type, isActive, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className={`glass rounded-2xl p-6 border-l-4 cursor-pointer transition-all ${isActive ? 'ring-2 ring-neon-cyan border-neon-cyan' : 'border-white/5 hover:border-white/20'}`}
    style={{ borderLeftColor: type === 'expected' ? '#00FF00' : '#FF007A' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${type === 'expected' ? 'bg-lime-green/10 text-lime-green' : 'bg-vivid-magenta/10 text-vivid-magenta'}`}>
          {type === 'expected' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </div>
        <h4 className="text-sm font-black tracking-tighter text-text-primary uppercase">{title}</h4>
      </div>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{type}</span>
    </div>
    
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]: any) => (
        <div key={key} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
          <span className="text-xs text-text-muted font-mono">{key}</span>
          <span className={`text-xs font-bold ${typeof value === 'string' && value.includes('Error') ? 'text-vivid-magenta' : 'text-text-secondary'}`}>
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

const DiffViewer = ({ expected, actual }: any) => {
  const keys = Array.from(new Set([...Object.keys(expected), ...Object.keys(actual)]));
  
  return (
    <div className="glass rounded-3xl overflow-hidden border border-border-subtle h-full">
      <div className="p-4 border-b border-border-subtle bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-neon-cyan" />
          <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Deviation Heatmap</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lime-green" />
            <span className="text-[10px] font-bold text-text-muted uppercase">Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-vivid-magenta" />
            <span className="text-[10px] font-bold text-text-muted uppercase">Drift</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {keys.map(key => {
          const isDifferent = expected[key] !== actual[key];
          return (
            <div key={key} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-xs font-mono text-text-muted">{key}</div>
              <div className="col-span-9 flex items-center gap-2">
                <div className={`flex-1 p-3 rounded-xl border ${isDifferent ? 'bg-vivid-magenta/5 border-vivid-magenta/20 text-vivid-magenta' : 'bg-lime-green/5 border-lime-green/20 text-lime-green'} text-xs font-bold transition-all`}>
                  {String(actual[key])}
                </div>
                {isDifferent && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ChevronRight size={14} className="text-text-muted" />
                    <div className="p-3 rounded-xl bg-surface border border-border-subtle text-text-muted text-xs line-through">
                      {String(expected[key])}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ResultDeviationEngine = ({ customTests = [] }: { customTests?: any[] }) => {
  const [activeTest, setActiveTest] = useState(0);
  
  const baseTestData = [
    {
      id: 1,
      title: "User Auth Flow",
      source: "System",
      expected: { status: 200, role: "admin", token_type: "Bearer", expires: 3600 },
      actual: { status: 401, role: "guest", token_type: "None", expires: 0 },
      deviation: 85,
      history: [
        { time: '10:00', drift: 5 },
        { time: '10:15', drift: 12 },
        { time: '10:30', drift: 8 },
        { time: '10:45', drift: 45 },
        { time: '11:00', drift: 85 },
      ],
      recommendation: "Authentication bypass detected. Check JWT signature validation and token expiration logic in /api/v1/auth."
    },
    {
      id: 2,
      title: "Data Sync Pipeline",
      source: "System",
      expected: { records: 1500, latency: "45ms", integrity: "SHA-256" },
      actual: { records: 1498, latency: "120ms", integrity: "SHA-256" },
      deviation: 12,
      history: [
        { time: '10:00', drift: 2 },
        { time: '10:15', drift: 4 },
        { time: '10:30', drift: 15 },
        { time: '10:45', drift: 10 },
        { time: '11:00', drift: 12 },
      ],
      recommendation: "Minor data loss and latency spike. Investigate database connection pooling and write-ahead log (WAL) synchronization."
    }
  ];

  const testData = [...baseTestData, ...customTests.map((t, i) => ({
    ...t,
    id: `custom-${i}`,
    source: "Visual Builder",
    history: [
      { time: '10:00', drift: 0 },
      { time: '11:00', drift: t.deviation },
    ]
  }))];

  const currentTest = testData[activeTest] || testData[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black tracking-tighter text-text-primary flex items-center gap-2">
              <Target className="text-vivid-magenta shrink-0" size={20} />
              DEVIATION ENGINE
            </h3>
            <div className="group/help relative">
              <Info size={14} className="text-text-muted hover:text-neon-cyan cursor-help shrink-0" />
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-deep-space border border-border-subtle rounded-xl text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-0 group-hover/help:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl backdrop-blur-xl">
                Compare real-time system outputs against baseline security expectations. Drift detection highlights unauthorized behavior or unexpected state changes.
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-widest">Actual vs Expected Analysis</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border-subtle w-full sm:w-auto overflow-x-auto max-w-full">
          {testData.map((test, idx) => (
            <motion.button
              key={test.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTest(idx)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTest === idx ? 'bg-neon-cyan text-deep-space shadow-lg shadow-neon-cyan/20' : 'text-text-muted hover:text-text-primary'}`}
            >
              {test.title}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Results & Score */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-4 border border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Source</span>
            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${currentTest.source === 'Visual Builder' ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-vivid-magenta/10 text-vivid-magenta'}`}>
              {currentTest.source}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <DeviationCard 
              title="Expected Baseline" 
              data={currentTest.expected} 
              type="expected" 
            />
            <DeviationCard 
              title="Current State" 
              data={currentTest.actual} 
              type="actual" 
              isActive={true}
            />
          </div>
          
          <div className="glass rounded-3xl p-6 border border-border-subtle relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap size={40} className="text-vivid-magenta/10" />
            </div>
            <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Drift Intensity</h5>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-black tracking-tighter ${currentTest.deviation > 50 ? 'text-vivid-magenta' : 'text-neon-cyan'}`}>
                {currentTest.deviation}%
              </span>
              <span className="text-xs text-text-muted font-bold mb-2 uppercase">Critical Drift</span>
            </div>
            <div className="mt-6 w-full h-2 bg-surface rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentTest.deviation}%` }}
                className={`h-full ${currentTest.deviation > 50 ? 'bg-vivid-magenta neon-glow-magenta' : 'bg-neon-cyan neon-glow-cyan'}`}
              />
            </div>
          </div>
        </div>

        {/* Middle Column: Heatmap */}
        <div className="xl:col-span-1">
          <DiffViewer expected={currentTest.expected} actual={currentTest.actual} />
        </div>

        {/* Right Column: Analytics & Recommendations */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 border border-border-subtle h-[300px]">
            <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={14} className="text-neon-cyan" />
              Drift Timeline
            </h5>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentTest.history}>
                  <defs>
                    <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentTest.deviation > 50 ? '#FF007A' : '#00F5FF'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentTest.deviation > 50 ? '#FF007A' : '#00F5FF'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 100]}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--deep-space)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#00F5FF', fontWeight: 900, textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="drift" 
                    stroke={currentTest.deviation > 50 ? '#FF007A' : '#00F5FF'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDrift)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-border-subtle bg-vivid-magenta/5">
            <h5 className="text-[10px] font-black text-vivid-magenta uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert size={14} />
              AI Remediation Strategy
            </h5>
            <p className="text-xs text-text-secondary font-bold leading-relaxed mb-6">
              {currentTest.recommendation}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-surface border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary hover:bg-surface-hover transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Export Patch Script
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
