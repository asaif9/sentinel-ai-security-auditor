import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Cpu, 
  Zap, 
  Globe, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Code, 
  Terminal, 
  Bot,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  GitBranch,
  Copy,
  Check
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('asaif9@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-deep-space border border-border-subtle p-8 md:p-12">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-neon-cyan/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Shield size={12} />
            The Architect's Vision
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-6 leading-none uppercase"
          >
            Redefining <span className="text-neon-cyan">Autonomous</span> AppSec.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-text-muted leading-relaxed mb-8"
          >
            Sentinel AI Security Auditor bridges the gap between passive vulnerability scanning and proactive, autonomous threat hunting. Built on zero-trust engineering, distributed reasoning, and Model Context Protocol (MCP) tool execution, it enables engineering organizations to detect complex multi-stage attack chains and deploy production-ready unified Git diff remedies before adversaries strike.
          </motion.p>
          
          <div className="flex flex-wrap items-center gap-4">
            <motion.a
              href="mailto:asaif9@gmail.com"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-neon-cyan text-deep-space rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-neon-cyan/20 cursor-pointer"
            >
              <Mail size={16} />
              Contact Architect
            </motion.a>
            <motion.button
              onClick={handleCopyEmail}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-border-subtle bg-surface text-text-muted hover:text-neon-cyan hover:border-neon-cyan/30 text-xs font-bold transition-all cursor-pointer"
            >
              {copiedEmail ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copiedEmail ? 'Email Copied!' : 'Copy Email Address'}
            </motion.button>
            <div className="flex gap-2">
              {[
                { icon: Github, href: "https://github.com", label: "GitHub" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" }
              ].map(({ icon: Icon, href, label }, i) => (
                <motion.a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.08, backgroundColor: 'rgba(0, 245, 255, 0.1)' }}
                  whileTap={{ scale: 0.92 }}
                  className="p-3.5 rounded-2xl border border-border-subtle text-text-muted hover:text-neon-cyan transition-colors"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture Highlights Row */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Autonomous Agents', value: '10 Agents', sub: 'Hierarchical MCP Mesh' },
          { label: 'Audit Lifecycle', value: '5 Phases', sub: 'Triage to Remediate' },
          { label: 'Supported Frameworks', value: '4 Stacks', sub: 'Unified Git Diffs' },
          { label: 'Client Exposure', value: '0 Secrets', sub: 'Secret Manager Resolved' }
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 border border-border-subtle">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{stat.label}</div>
            <div className="text-xl sm:text-2xl font-black text-neon-cyan tracking-tight">{stat.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1 glass rounded-3xl p-8 border border-border-subtle relative group flex flex-col justify-between"
        >
          <div>
            <div className="aspect-square rounded-2xl bg-surface-hover mb-6 overflow-hidden border border-border-subtle relative">
              <img 
                src="https://picsum.photos/seed/architect/800/800" 
                alt="Architect Profile" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space to-transparent opacity-60" />
            </div>
            <h2 className="text-2xl font-black text-text-primary tracking-tighter mb-1 uppercase">Asaif</h2>
            <p className="text-neon-cyan text-[10px] font-black uppercase tracking-widest mb-4">Lead AI Security Architect</p>
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              Specializing in distributed multi-agent systems, autonomous security orchestration, Zero-Trust cloud architecture, and high-assurance AppSec engineering. Dedicated to empowering developers with transparent, verifiable security automation.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <a 
              href="mailto:asaif9@gmail.com" 
              className="flex items-center gap-3 text-xs text-text-muted hover:text-neon-cyan transition-colors"
            >
              <Mail size={15} className="text-neon-cyan shrink-0" />
              <span className="font-mono">asaif9@gmail.com</span>
            </a>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <Globe size={15} className="text-neon-cyan shrink-0" />
              <span className="font-mono">architect.security.ai</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <Lock size={15} className="text-neon-cyan shrink-0" />
              <span>Zero-Trust Infrastructure Verified</span>
            </div>
          </div>
        </motion.div>

        {/* Core Values & Tech Stack */}
        <div className="md:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { 
                icon: Cpu, 
                title: "Autonomous Intelligence", 
                desc: "Powered by Google Gemini 3.8 Flash & Gemini 3.1 Pro via @google/genai for multi-turn MCP function calling, automated fuzzing, and compound exploit chaining." 
              },
              { 
                icon: Shield, 
                title: "Zero-Trust Infrastructure", 
                desc: "Zero secrets in client browser code. Dynamic runtime key resolution via Google Cloud Secret Manager, partitioned Firestore security rules, and prompt injection firebreaks." 
              },
              { 
                icon: Terminal, 
                title: "Dual-Engine Web Crawling", 
                desc: "Combining high-throughput Scrapy link traversal (~240 req/s) with Crawl4AI headless Chromium SPA exploration to uncover complex state machine flaws." 
              },
              { 
                icon: GitBranch, 
                title: "Production Patch Synthesis", 
                desc: "AppSec-Engineer automatically synthesizes production-ready Unified Git Diffs across Express, FastAPI, Spring Boot, and Next.js with verification unit tests." 
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-6 rounded-3xl bg-surface/50 border border-border-subtle hover:border-neon-cyan/30 transition-colors"
              >
                <div className="p-3 rounded-xl bg-neon-cyan/10 text-neon-cyan w-fit mb-4">
                  <item.icon size={20} />
                </div>
                <h3 className="text-base font-black text-text-primary tracking-tight mb-2 uppercase">{item.title}</h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack Section */}
          <section className="glass rounded-3xl p-8 border border-border-subtle">
            <h3 className="text-xl font-black text-text-primary tracking-tighter mb-4 uppercase flex items-center gap-3">
              <Bot size={20} className="text-neon-cyan" />
              Verified Technology Stack
            </h3>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              Every component and library powering Sentinel AI Security Auditor is strictly production-tested and verified against the running application stack:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                'React 19', 
                'TypeScript 5.8', 
                'Tailwind CSS v4', 
                '@google/genai SDK', 
                'Gemini 3.8 Flash', 
                'Gemini 3.1 Pro', 
                'ReactFlow 11', 
                'D3.js 7', 
                'Recharts 3', 
                'Motion 12', 
                'Express 4.21', 
                'Vite 6.2 Middleware', 
                'Google Cloud Firestore', 
                'Firebase Auth', 
                'Secret Manager Client', 
                'Python (Scrapy & Crawl4AI)', 
                'jsPDF & Autotable'
              ].map((tech) => (
                <span 
                  key={tech} 
                  className="px-3.5 py-1.5 rounded-xl bg-surface border border-border-subtle text-[11px] font-bold text-text-muted uppercase tracking-wider hover:text-neon-cyan hover:border-neon-cyan/30 transition-all cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
