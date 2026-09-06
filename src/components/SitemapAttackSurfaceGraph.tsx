import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Play, 
  RefreshCw, 
  Filter, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  Crosshair, 
  Terminal, 
  Lock, 
  Zap, 
  ChevronRight, 
  Server, 
  Activity,
  Flame,
  Info
} from 'lucide-react';
import * as d3 from 'd3';

export interface DiscoveredEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  riskScore: number; // 0 - 100
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low' | 'Clean';
  engineSource: 'Scrapy' | 'Crawl4AI';
  vulnerabilities: string[];
  tags: string[];
  params: string[];
  fuzzingStatus: 'Vulnerable' | 'Warning' | 'Tested Clean' | 'Pending';
  description: string;
}

export interface CrawlerTelemetryData {
  crawler: string;
  activeEngine: 'scrapy' | 'crawl4ai';
  engineBadge: string;
  engineStatus: string;
  targetUrl: string;
  endpoints: DiscoveredEndpoint[];
  complexScenarios?: string[];
  complex_scenarios?: string[];
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    clean: number;
  };
}

interface SitemapAttackSurfaceGraphProps {
  initialTargetUrl?: string;
  onFuzzEndpoint?: (endpoint: DiscoveredEndpoint) => void;
}

export const SitemapAttackSurfaceGraph: React.FC<SitemapAttackSurfaceGraphProps> = ({
  initialTargetUrl = 'https://target-portal.internal',
  onFuzzEndpoint
}) => {
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl);
  const [selectedEngine, setSelectedEngine] = useState<'auto' | 'scrapy' | 'crawl4ai'>('auto');
  const [activeEngine, setActiveEngine] = useState<'scrapy' | 'crawl4ai'>('crawl4ai');
  const [isLoading, setIsLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<CrawlerTelemetryData | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DiscoveredEndpoint | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Fetch telemetry or run crawl
  const fetchTelemetry = async (engineToUse = selectedEngine, urlToUse = targetUrl) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crawler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToUse,
          crawler: engineToUse === 'auto' ? (urlToUse.includes('auth') || urlToUse.includes('app') ? 'crawl4ai' : 'crawl4ai') : engineToUse,
          depth: 3
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        setActiveEngine(data.activeEngine || (engineToUse === 'scrapy' ? 'scrapy' : 'crawl4ai'));
        if (data.endpoints && data.endpoints.length > 0 && !selectedEndpoint) {
          setSelectedEndpoint(data.endpoints[0]);
        }
      }
    } catch (e) {
      console.warn("Using fallback local telemetry:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(selectedEngine, targetUrl);
  }, []);

  const endpoints = telemetry?.endpoints || [];

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      const matchesRisk = selectedRiskFilter === 'all' || ep.riskLevel.toLowerCase() === selectedRiskFilter.toLowerCase();
      const matchesSearch = !searchQuery || ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || ep.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRisk && matchesSearch;
    });
  }, [endpoints, selectedRiskFilter, searchQuery]);

  // Render D3 Graph Topology
  useEffect(() => {
    if (!svgRef.current || viewMode !== 'graph' || filteredEndpoints.length === 0) return;

    const width = 760;
    const height = 440;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rootNode = { id: 'root', path: '/', name: 'Target Root', riskLevel: 'Clean', riskScore: 0, isRoot: true };

    const nodes: any[] = [rootNode, ...filteredEndpoints.map(ep => ({
      ...ep,
      name: ep.path
    }))];

    const links: any[] = filteredEndpoints.map(ep => ({
      source: 'root',
      target: ep.id,
      riskLevel: ep.riskLevel
    }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d: any) => {
        const targetRisk = (d.target as any).riskScore || 50;
        return 120 + (100 - targetRisk) * 0.5;
      }))
      .force("charge", d3.forceManyBody().strength(-340))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35));

    const g = svg.append("g");

    // Draw Links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => {
        switch (d.riskLevel) {
          case 'Critical': return '#ec4899';
          case 'High': return '#f97316';
          case 'Medium': return '#eab308';
          default: return '#06b6d4';
        }
      })
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d: any) => d.riskLevel === 'Critical' ? 2.5 : 1.5)
      .attr("stroke-dasharray", (d: any) => d.riskLevel === 'Critical' ? '4 2' : 'none');

    // Draw Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .on("click", (event, d: any) => {
        if (!d.isRoot) {
          setSelectedEndpoint(d);
        }
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

    // Outer glow for critical nodes
    node.filter((d: any) => d.riskLevel === 'Critical')
      .append("circle")
      .attr("r", 26)
      .attr("fill", "none")
      .attr("stroke", "#ec4899")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.7)
      .attr("class", "animate-ping");

    // Node body circle
    node.append("circle")
      .attr("r", (d: any) => d.isRoot ? 22 : 18)
      .attr("fill", (d: any) => {
        if (d.isRoot) return "#0f172a";
        switch (d.riskLevel) {
          case 'Critical': return '#831843';
          case 'High': return '#7c2d12';
          case 'Medium': return '#713f12';
          case 'Low': return '#164e63';
          default: return '#14532d';
        }
      })
      .attr("stroke", (d: any) => {
        if (d.isRoot) return "#38bdf8";
        switch (d.riskLevel) {
          case 'Critical': return '#f43f5e';
          case 'High': return '#f97316';
          case 'Medium': return '#eab308';
          case 'Low': return '#06b6d4';
          default: return '#22c55e';
        }
      })
      .attr("stroke-width", (d: any) => selectedEndpoint?.id === d.id ? 3 : 1.5);

    // Method badge inside circle
    node.append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", (d: any) => d.isRoot ? "10px" : "8px")
      .attr("font-weight", "900")
      .text((d: any) => d.isRoot ? "HOST" : d.method);

    // Endpoint label below node
    node.append("text")
      .attr("dy", 32)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => selectedEndpoint?.id === d.id ? "#38bdf8" : "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text((d: any) => d.isRoot ? "/" : d.path.length > 20 ? d.path.slice(0, 18) + "..." : d.path);

    // Risk score badge above node
    node.filter((d: any) => !d.isRoot)
      .append("text")
      .attr("dy", -22)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => {
        switch (d.riskLevel) {
          case 'Critical': return '#f43f5e';
          case 'High': return '#f97316';
          case 'Medium': return '#eab308';
          default: return '#22c55e';
        }
      })
      .attr("font-size", "9px")
      .attr("font-weight", "900")
      .text((d: any) => `${d.riskScore}`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => Math.max(30, Math.min(width - 30, d.source.x)))
        .attr("y1", (d: any) => Math.max(30, Math.min(height - 30, d.source.y)))
        .attr("x2", (d: any) => Math.max(30, Math.min(width - 30, d.target.x)))
        .attr("y2", (d: any) => Math.max(30, Math.min(height - 30, d.target.y)));

      node
        .attr("transform", (d: any) => `translate(${Math.max(30, Math.min(width - 30, d.x))},${Math.max(30, Math.min(height - 30, d.y))})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredEndpoints, viewMode, selectedEndpoint]);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-vivid-magenta/10 text-vivid-magenta border-vivid-magenta/30';
      case 'High': return 'bg-caution/10 text-caution border-caution/30';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/30';
      case 'Low': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
      default: return 'bg-lime-green/10 text-lime-green border-lime-green/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Engine Status & Active Indicators */}
      <div className="rounded-3xl border border-border-subtle bg-surface-card p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
              <Globe className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-text-primary tracking-tight">
                  Dual-Engine Crawler Intelligence
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                  Scrapy + Crawl4AI Telemetry
                </span>
              </div>
              <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
                Adaptive crawling runtime dynamically selects high-throughput static AST parsing via Scrapy or launches headless Chromium via Crawl4AI to execute state transitions, solve MFA challenges, and inspect client-side SPAs.
              </p>
            </div>
          </div>

          {/* Engine Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-surface p-1.5 rounded-2xl border border-border-subtle self-start lg:self-auto">
            <button
              onClick={() => {
                setSelectedEngine('auto');
                fetchTelemetry('auto', targetUrl);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedEngine === 'auto'
                  ? 'bg-neon-cyan text-deep-space font-black shadow-md shadow-neon-cyan/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Auto-Select
            </button>
            <button
              onClick={() => {
                setSelectedEngine('scrapy');
                fetchTelemetry('scrapy', targetUrl);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedEngine === 'scrapy'
                  ? 'bg-neon-cyan text-deep-space font-black shadow-md shadow-neon-cyan/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Server size={12} />
              Scrapy (Static)
            </button>
            <button
              onClick={() => {
                setSelectedEngine('crawl4ai');
                fetchTelemetry('crawl4ai', targetUrl);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedEngine === 'crawl4ai'
                  ? 'bg-neon-cyan text-deep-space font-black shadow-md shadow-neon-cyan/20'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Cpu size={12} />
              Crawl4AI (Headless)
            </button>
          </div>
        </div>

        {/* Live Engine Indicator Telemetry Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-surface border border-border-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={`w-3.5 h-3.5 rounded-full inline-block ${activeEngine === 'crawl4ai' ? 'bg-caution' : 'bg-lime-green'} animate-ping`} />
              <span className={`w-3.5 h-3.5 rounded-full inline-block absolute top-0 left-0 ${activeEngine === 'crawl4ai' ? 'bg-caution' : 'bg-lime-green'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                  {telemetry?.engineBadge || (activeEngine === 'crawl4ai' ? "Crawl4AI: Headless Chromium Active" : "Scrapy: Parsing Static DOM")}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${activeEngine === 'crawl4ai' ? 'bg-caution/10 text-caution border-caution/20' : 'bg-lime-green/10 text-lime-green border-lime-green/20'}`}>
                  {activeEngine === 'crawl4ai' ? "Headless DOM Mode" : "High Throughput Mode"}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                {telemetry?.engineStatus || "Live engine telemetry dispatched from server-side Python runner."}
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchTelemetry(selectedEngine, targetUrl)}
            disabled={isLoading}
            className="px-4 py-2 bg-surface-hover hover:bg-neon-cyan/10 text-text-primary hover:text-neon-cyan border border-border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-end md:self-auto disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-neon-cyan" : ""} />
            {isLoading ? "Crawling Surface..." : "Re-Crawl Target"}
          </button>
        </div>

        {/* Complex Scenarios Discovered by Crawl4AI */}
        {telemetry?.complex_scenarios && (
          <div className="mt-4 p-4 rounded-2xl bg-caution/5 border border-caution/20">
            <div className="text-[10px] font-black uppercase tracking-wider text-caution mb-2 flex items-center gap-1.5">
              <Flame size={12} />
              Crawl4AI Deep Discovery Highlights (MFA & State Machines)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {telemetry.complex_scenarios.map((sc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-muted bg-surface/80 p-2.5 rounded-xl border border-border-subtle">
                  <CheckCircle2 size={12} className="text-caution shrink-0" />
                  <span>{sc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attack Surface Topology & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Attack Surface Graph */}
        <div className="lg:col-span-8 rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-subtle">
            <div>
              <h4 className="text-base font-black text-text-primary tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-neon-cyan" />
                Sitemap Attack Surface Graph
              </h4>
              <p className="text-[11px] text-text-muted">
                Visualizing {filteredEndpoints.length} endpoints grouped by attack surface risk score
              </p>
            </div>

            {/* View Mode & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-surface p-1 rounded-xl border border-border-subtle text-xs">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    viewMode === 'graph' ? 'bg-neon-cyan text-deep-space font-black' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Graph Topology
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    viewMode === 'matrix' ? 'bg-neon-cyan text-deep-space font-black' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Surface Matrix
                </button>
              </div>

              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-border-subtle rounded-xl text-xs font-bold text-text-primary focus:ring-1 focus:ring-neon-cyan outline-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical (90+)</option>
                <option value="high">High (70-89)</option>
                <option value="medium">Medium (40-69)</option>
                <option value="low">Low (0-39)</option>
              </select>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search route paths (e.g. /oauth, /api/v1, /checkout)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted/60 focus:ring-2 focus:ring-neon-cyan outline-none"
            />
          </div>

          {/* Graph View (SVG / D3) */}
          {viewMode === 'graph' ? (
            <div className="w-full h-[440px] bg-deep-space rounded-2xl overflow-hidden relative border border-border-subtle flex items-center justify-center">
              <svg ref={svgRef} viewBox="0 0 760 440" className="w-full h-full" />
              <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-subtle text-[10px] text-text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-vivid-magenta" /> Critical</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-caution" /> High</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-lime-green" /> Low/Clean</span>
              </div>
            </div>
          ) : (
            /* Matrix View */
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-2">
              {filteredEndpoints.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedEndpoint?.id === ep.id
                      ? 'bg-neon-cyan/10 border-neon-cyan shadow-sm'
                      : 'bg-surface/70 border-border-subtle hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle text-[10px] font-black text-text-primary">
                      {ep.method}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-text-primary font-mono">{ep.path}</div>
                      <div className="text-[10px] text-text-muted flex items-center gap-2 mt-0.5">
                        <span>Engine: {ep.engineSource}</span>
                        <span>•</span>
                        <span>{ep.vulnerabilities.length} threat candidates</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase ${getRiskBadgeColor(ep.riskLevel)}`}>
                      {ep.riskScore} / 100 ({ep.riskLevel})
                    </span>
                    <ChevronRight size={14} className="text-text-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 4 Cols: Endpoint Risk & Fuzzing Inspector */}
        <div className="lg:col-span-4 rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-xl flex flex-col justify-between">
          {selectedEndpoint ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getRiskBadgeColor(selectedEndpoint.riskLevel)}`}>
                    Score {selectedEndpoint.riskScore} • {selectedEndpoint.riskLevel}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted">
                    Engine: {selectedEndpoint.engineSource}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan text-[11px] font-black font-mono">
                    {selectedEndpoint.method}
                  </span>
                  <h4 className="text-sm font-bold text-text-primary font-mono truncate">
                    {selectedEndpoint.path}
                  </h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {selectedEndpoint.description}
                </p>
              </div>

              {/* Vulnerabilities Detected */}
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-caution" />
                  Identified Exploit Candidates
                </div>
                {selectedEndpoint.vulnerabilities.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedEndpoint.vulnerabilities.map((v, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-caution/10 border border-caution/20 text-xs font-bold text-caution flex items-center gap-2">
                        <Zap size={12} className="shrink-0 text-caution" />
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-lime-green/10 border border-lime-green/20 text-xs font-bold text-lime-green flex items-center gap-2">
                    <ShieldCheck size={14} />
                    <span>No critical vulnerabilities flagged on this route</span>
                  </div>
                )}
              </div>

              {/* Query & Body Parameters */}
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Fuzzing Parameters
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEndpoint.params.map(p => (
                    <span key={p} className="px-2 py-1 bg-surface border border-border-subtle rounded-lg text-[10px] font-mono text-neon-cyan">
                      {p}
                    </span>
                  ))}
                  {selectedEndpoint.params.length === 0 && (
                    <span className="text-xs text-text-muted">None specified</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                  Attack Surface Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEndpoint.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-surface text-text-muted border border-border-subtle rounded-md text-[10px] font-bold">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button: Trigger Targeted Fuzzing */}
              <div className="pt-4 border-t border-border-subtle">
                <button
                  onClick={() => onFuzzEndpoint && onFuzzEndpoint(selectedEndpoint)}
                  className="w-full py-3 bg-neon-cyan hover:bg-neon-cyan/90 text-deep-space font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-neon-cyan/20 transition-all flex items-center justify-center gap-2"
                >
                  <Crosshair size={14} />
                  Trigger Infiltrator-X Fuzzing
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-text-muted">
              <Crosshair size={40} className="opacity-20 mb-3" />
              <p className="text-xs font-bold">Select any node on the graph to inspect the attack surface and initiate targeted agent testing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
