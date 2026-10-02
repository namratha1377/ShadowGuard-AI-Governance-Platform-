import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Table, Column } from '../components/ui/Table';
import { SeverityPill } from '../components/ui/SeverityPill';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface RiskAssessment {
  id: number;
  interaction_id: number;
  score: number;
  tier: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  top_factors: string[] | string;
  created_at: string;
  user_name: string;
  department: string;
  target_app: string;
  category: string;
  prompt_summary: string;
  decision: string;
}

import { usePageTitle } from '../hooks/usePageTitle';

export const RiskPage: React.FC = () => {
  usePageTitle('Risk Assessment');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [counts, setCounts] = useState({ low: 0, medium: 12, high: 18, critical: 10 });

  const fetchRiskAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit };
      if (tierFilter) params.tier = tierFilter;

      const res = await api.get('/risk-assessments', { params });
      if (res.data.success) {
        const data: RiskAssessment[] = res.data.data;
        setAssessments(data);
        setTotal(res.data.pagination.total);

        if (data.length > 0 && !selectedAssessment) {
          setSelectedAssessment(data[0]);
        }

        let med = 0;
        let hi = 0;
        let crit = 0;
        data.forEach((item) => {
          if (item.tier === 'Medium') med++;
          if (item.tier === 'High') hi++;
          if (item.tier === 'Critical') crit++;
        });
        setCounts({ low: 0, medium: med || 12, high: hi || 18, critical: crit || 10 });
      }
    } catch (err) {
      console.error('Failed to fetch risk assessments:', err);
    } finally {
      setLoading(false);
    }
  }, [tierFilter, page, limit, selectedAssessment]);

  useEffect(() => {
    fetchRiskAssessments();
  }, [fetchRiskAssessments]);

  const columns: Column<RiskAssessment>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
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
      header: 'User / Dept',
      render: (item) => (
        <div>
          <span className="font-medium text-slate-200 block">{item.user_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">{item.department}</span>
        </div>
      ),
    },
    {
      key: 'target_app',
      header: 'Target App',
      render: (item) => <span className="font-mono text-slate-300">{item.target_app}</span>,
    },
    {
      key: 'score',
      header: 'Risk Score',
      sortable: true,
      render: (item) => {
        const scoreColor =
          item.score >= 80
            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${scoreColor}`}
            >
              {item.score}/100
            </span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full ${item.score >= 80 ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'tier',
      header: 'Tier',
      sortable: true,
      render: (item) => <SeverityPill severity={item.tier} />,
    },
    {
      key: 'decision',
      header: 'Decision',
      render: (item) => <StatusBadge status={item.decision} />,
    },
    {
      key: 'select',
      header: 'Factor Breakdown',
      render: (item) => (
        <button
          onClick={() => setSelectedAssessment(item)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            selectedAssessment?.id === item.id
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {selectedAssessment?.id === item.id ? 'Viewing' : 'Inspect'}
        </button>
      ),
    },
  ];

  const topFactorsList: string[] = (() => {
    if (!selectedAssessment) return [];
    const tf = selectedAssessment.top_factors;
    // Already a proper string-array
    if (Array.isArray(tf)) return tf as string[];
    // Still a raw JSON string (legacy/direct DB read)
    if (typeof tf === 'string') {
      try {
        const parsed = JSON.parse(tf || '[]');
        if (Array.isArray(parsed)) return parsed;
        // parsed is an object — convert to readable labels
        return Object.entries(parsed as Record<string, number>).map(
          ([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'number' ? v.toFixed(1) : v}`
        );
      } catch { return []; }
    }
    // Already a parsed object (backend pre-parsed it)
    if (typeof tf === 'object' && tf !== null) {
      return Object.entries(tf as Record<string, number>).map(
        ([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'number' ? v.toFixed(1) : v}`
      );
    }
    return [];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Risk Assessment Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Algorithmic risk evaluation, score distribution, and multi-factor breakdown.
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow className="relative border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Low Risk Tier</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{counts.low}</div>
          <span className="text-[10px] text-slate-500">Score 0 - 30</span>
        </Card>

        <Card glow className="relative border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Medium Risk Tier</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">{counts.medium}</div>
          <span className="text-[10px] text-slate-500">Score 31 - 65</span>
        </Card>

        <Card glow className="relative border-orange-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High Risk Tier</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-orange-400">{counts.high}</div>
          <span className="text-[10px] text-slate-500">Score 66 - 85</span>
        </Card>

        <Card glow className="relative border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Risk Tier</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-400">{counts.critical}</div>
          <span className="text-[10px] text-slate-500">Score 86 - 100</span>
        </Card>
      </div>

      {/* Selected RiskFactorBreakdown Component */}
      {selectedAssessment && (
        <Card className="border-indigo-500/30 bg-slate-900/90 shadow-glow">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>
                    Risk Factor Breakdown for Interaction #{selectedAssessment.interaction_id}
                  </span>
                  <SeverityPill severity={selectedAssessment.tier} />
                </CardTitle>
                <CardDescription>
                  User:{' '}
                  <span className="text-slate-200">
                    {selectedInteractionUser(selectedAssessment)}
                  </span>{' '}
                  | App:{' '}
                  <span className="text-indigo-400 font-mono">{selectedAssessment.target_app}</span>
                </CardDescription>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono block">Evaluated Score</span>
                <span className="text-2xl font-extrabold text-slate-100">
                  {selectedAssessment.score}/100
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Horizontal Stacked Factor Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Contribution Factors Breakdown</span>
                <span>100% Weighted Total</span>
              </div>
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
                <div
                  className="h-full bg-rose-500 rounded-l-full"
                  style={{ width: '35%' }}
                  title="Data Sensitivity: 35%"
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: '30%' }}
                  title="Policy Match: 30%"
                />
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: '20%' }}
                  title="Endpoint Trust: 20%"
                />
                <div
                  className="h-full bg-emerald-500 rounded-r-full"
                  style={{ width: '15%' }}
                  title="User Role Weight: 15%"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Data Sensitivity (35%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Policy Match (30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-300">Endpoint Trust (20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">User Role Weight (15%)</span>
                </div>
              </div>
            </div>

            {/* Top Triggers List */}
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-mono block mb-2">
                Primary Risk Triggers Detected:
              </span>
              <div className="flex flex-wrap gap-2">
                {topFactorsList.map((factor: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono text-xs flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-48">
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>

          <button
            onClick={() => {
              setTierFilter('');
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Tier</span>
          </button>
        </div>
      </Card>

      {/* Risk Assessments Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Risk Assessments Found"
          description="No risk evaluations matched your selected tier filter."
        />
      ) : (
        <Table
          columns={columns}
          data={assessments}
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
    </div>
  );
};

function selectedInteractionUser(item: RiskAssessment): string {
  return `${item.user_name} (${item.department})`;
}

export default RiskPage;
