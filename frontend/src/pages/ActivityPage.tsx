import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RefreshCw, Eye, ExternalLink, ShieldCheck, FileCode } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Table, Column } from '../components/ui/Table';
import { SeverityPill } from '../components/ui/SeverityPill';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

interface Interaction {
  id: number;
  user_name: string;
  department: string;
  target_app: string;
  category: string;
  prompt_summary: string;
  risk_tier: string;
  decision: string;
  created_at: string;
}

interface SecurityLogItem {
  id: number;
  interaction_id: number;
  category: string;
  matched_pattern: string;
  action: string;
}

interface RiskAssessmentItem {
  id: number;
  interaction_id: number;
  score: number;
  tier: string;
  top_factors: string[];
}

interface DetailData {
  riskAssessment?: RiskAssessmentItem;
  securityLogs?: SecurityLogItem[];
}

import { usePageTitle } from '../hooks/usePageTitle';

export const ActivityPage: React.FC = () => {
  usePageTitle('AI Activity');
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params if present
  const [userInput, setUserInput] = useState<string>(searchParams.get('user') || '');
  const [debouncedUser, setDebouncedUser] = useState<string>(searchParams.get('user') || '');
  const [department, setDepartment] = useState<string>(searchParams.get('department') || '');
  const [targetApp, setTargetApp] = useState<string>(searchParams.get('targetApp') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // Data & Loading States
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Drawer / Detail Modal State
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Debounce user search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUser(userInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [userInput]);

  // Fetch interactions when filters change
  const fetchInteractions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit };

      if (debouncedUser) params.user = debouncedUser;
      if (department) params.department = department;
      if (targetApp) params.targetApp = targetApp;
      if (status) params.status = status;

      const res = await api.get('/ai-interactions', { params });
      if (res.data.success) {
        // Backend returns { data: { interactions: [...], pagination: {} } }
        const payload = res.data.data;
        const rows = Array.isArray(payload) ? payload : (payload?.interactions ?? []);
        const pag = payload?.pagination ?? res.data.pagination;
        setInteractions(rows);
        setTotal(pag?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch interactions:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedUser, department, targetApp, status, page, limit]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  // Fetch details for selected interaction
  const handleOpenDetail = async (item: Interaction) => {
    setSelectedInteraction(item);
    setDetailData(null);
    setLoadingDetail(true);

    try {
      const [secRes, riskRes] = await Promise.all([
        api.get('/data-security', { params: { limit: 100 } }).catch(() => null),
        api.get('/risk-assessments', { params: { limit: 100 } }).catch(() => null),
      ]);

      const matchedSec =
        secRes?.data?.data?.filter((log: SecurityLogItem) => log.interaction_id === item.id) || [];
      const matchedRisk =
        riskRes?.data?.data?.find((r: RiskAssessmentItem) => r.interaction_id === item.id) || null;

      setDetailData({
        securityLogs: matchedSec,
        riskAssessment: matchedRisk,
      });
    } catch (err) {
      console.error('Failed to load interaction details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const clearFilters = () => {
    setUserInput('');
    setDebouncedUser('');
    setDepartment('');
    setTargetApp('');
    setStatus('');
    setPage(1);
    setSearchParams({});
  };

  const columns: Column<Interaction>[] = [
    {
      key: 'created_at',
      header: 'Time',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-slate-300">
          {new Date(item.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'user_name',
      header: 'User',
      sortable: true,
      render: (item) => <span className="font-medium text-slate-200">{item.user_name}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (item) => <span className="text-slate-400">{item.department}</span>,
    },
    {
      key: 'target_app',
      header: 'Target App',
      sortable: true,
      render: (item) => <span className="font-mono text-slate-300">{item.target_app}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="text-slate-400 truncate max-w-[140px] block">{item.category}</span>
      ),
    },
    {
      key: 'risk_tier',
      header: 'Risk Tier',
      sortable: true,
      render: (item) => <SeverityPill severity={item.risk_tier} />,
    },
    {
      key: 'decision',
      header: 'Decision',
      sortable: true,
      render: (item) => <StatusBadge status={item.decision} />,
    },
    {
      key: 'actions',
      header: 'Detail',
      render: (item) => (
        <button
          onClick={() => handleOpenDetail(item)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="View Full Interaction Detail"
        >
          <Eye className="w-4 h-4 text-indigo-400" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">AI Prompt Activity</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time audit log of all prompts routed through ShadowGuard proxy & DLP engine.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* User Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Search user name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Department Select */}
          <div className="w-full md:w-44">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Product">Product</option>
            </select>
          </div>

          {/* Target App Select */}
          <div className="w-full md:w-40">
            <select
              value={targetApp}
              onChange={(e) => {
                setTargetApp(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Apps</option>
              <option value="ChatGPT">ChatGPT</option>
              <option value="Claude">Claude</option>
              <option value="Gemini">Gemini</option>
              <option value="Copilot">Copilot</option>
              <option value="Perplexity">Perplexity</option>
            </select>
          </div>

          {/* Decision Status Select */}
          <div className="w-full md:w-40">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Decisions</option>
              <option value="allowed">Allowed</option>
              <option value="restricted">Restricted</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </Card>

      {/* Main Table */}
      {interactions.length === 0 && !loading ? (
        <EmptyState
          icon={Filter}
          title="No Interaction Logs Found"
          description="No AI activity records matched your filter criteria. Try adjusting filters or resetting."
          action={
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={interactions}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pagination={{
            page,
            limit,
            total,
            onPageChange: (newPage) => setPage(newPage),
          }}
        />
      )}

      {/* Detail Side Drawer Modal */}
      {selectedInteraction && (
        <Modal
          isOpen={!!selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
          title={`Interaction #${selectedInteraction.id} Audit Detail`}
          footer={
            <button
              onClick={() => setSelectedInteraction(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
            >
              Close Drawer
            </button>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-400 font-mono block">Submitted By</span>
                <span className="text-sm font-semibold text-slate-100">
                  {selectedInteraction.user_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SeverityPill severity={selectedInteraction.risk_tier} />
                <StatusBadge status={selectedInteraction.decision} />
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Department</span>
                <span className="text-slate-200 font-semibold">
                  {selectedInteraction.department}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Target App</span>
                <span className="text-indigo-400 font-semibold">
                  {selectedInteraction.target_app}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Category</span>
                <span className="text-slate-200 font-semibold">{selectedInteraction.category}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Timestamp</span>
                <span className="text-slate-200">
                  {new Date(selectedInteraction.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Prompt Summary */}
            <div className="space-y-1">
              <label className="text-slate-400 font-mono font-medium block">Prompt Summary</label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed font-mono">
                {selectedInteraction.prompt_summary}
              </div>
            </div>

            {/* DLP Detected Entities */}
            <div className="space-y-2">
              <label className="text-slate-400 font-mono font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Detected DLP Entities & Policy Matches</span>
              </label>

              {loadingDetail ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 animate-pulse">
                  Loading DLP detections...
                </div>
              ) : detailData?.securityLogs && detailData.securityLogs.length > 0 ? (
                <div className="space-y-2">
                  {detailData.securityLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-rose-400 uppercase tracking-wider font-mono">
                          {log.category} Match
                        </span>
                        <p className="text-slate-300 font-mono text-[11px]">
                          {log.matched_pattern}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 font-mono">
                  No DLP violation patterns detected for this interaction.
                </div>
              )}
            </div>

            {/* Harness Trace Link */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <label className="text-slate-400 font-mono font-medium flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Execution Harness Trace</span>
              </label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-mono text-[11px]">
                  Harness trace not yet available (Execution Harness integration pending Phase 11)
                </span>
                <button
                  disabled
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-600 rounded-lg text-[11px] font-mono flex items-center gap-1 opacity-50 cursor-not-allowed"
                >
                  <span>Trace Log</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActivityPage;
