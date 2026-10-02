import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { SeverityPill } from '../components/ui/SeverityPill';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface MetricsData {
  totalInteractions: number;
  verdictBreakdown: {
    allowed: { count: number; percentage: number };
    restricted: { count: number; percentage: number };
    blocked: { count: number; percentage: number };
  };
  dailyVolume: { date: string; allowed: number; restricted: number; blocked: number }[];
  perAppCounts: { app: string; count: number }[];
  recentAlerts: {
    id: number;
    user_name: string;
    department: string;
    target_app: string;
    category: string;
    prompt_summary: string;
    risk_tier: string;
    decision: string;
    created_at: string;
  }[];
}

const DONUT_COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

import { usePageTitle } from '../hooks/usePageTitle';
import { useSocket } from '../context/SocketContext';
import { PendingReviewPanel, PendingInteraction } from '../components/dashboard/PendingReviewPanel';
import { AdminGuideSection } from '../components/dashboard/AdminGuideSection';
import { QuickTourOverlay } from '../components/dashboard/QuickTourOverlay';

export const DashboardPage: React.FC = () => {
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [data, setData] = useState<MetricsData | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingInteraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const fetchPendingReviews = async () => {
    try {
      const res = await api.get('/ai-interactions', { params: { status: 'pending_review', limit: 20 } });
      if (res.data?.success && Array.isArray(res.data.data?.interactions)) {
        setPendingReviews(res.data.data.interactions);
      }
    } catch (err) {
      console.warn('Could not fetch pending reviews:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchPendingReviews();
  }, []);

  // Subscribe to real-time "new-interaction" socket events (Phase 19/24)
  useEffect(() => {
    if (!socket) return;

    const handleNewInteraction = (interaction: any) => {
      console.log('[Dashboard] Real-time new-interaction event received:', interaction);

      // Prepend to pending reviews queue if flagged for review
      if (interaction.status === 'pending_review' || interaction.needs_action) {
        setPendingReviews((prev) => {
          if (prev.some((p) => p.id === interaction.id)) return prev;
          return [interaction, ...prev];
        });
      }

      setData((prev) => {
        if (!prev) return prev;
        const newTotal = prev.totalInteractions + 1;
        const isAlert = interaction.decision === 'restricted' || interaction.decision === 'blocked';
        const updatedRecent = isAlert
          ? [
              {
                id: interaction.id,
                user_name: interaction.user_name || 'Employee',
                department: interaction.department || 'Engineering',
                target_app: interaction.target_app || 'ChatGPT',
                category: interaction.category || 'General Assistant',
                prompt_summary:
                  interaction.prompt_summary || interaction.prompt || 'New Prompt Submission',
                risk_tier: interaction.risk_tier || 'Low',
                decision: interaction.decision || 'allowed',
                created_at: interaction.created_at || new Date().toISOString(),
              },
              ...prev.recentAlerts.slice(0, 9),
            ]
          : prev.recentAlerts;

        return {
          ...prev,
          totalInteractions: newTotal,
          recentAlerts: updatedRecent,
        };
      });
    };

    const handleInteractionReviewed = (event: { interaction_id: number }) => {
      setPendingReviews((prev) => prev.filter((item) => item.id !== event.interaction_id));
    };

    socket.on('new-interaction', handleNewInteraction);
    socket.on('interaction-reviewed', handleInteractionReviewed);

    return () => {
      socket.off('new-interaction', handleNewInteraction);
      socket.off('interaction-reviewed', handleInteractionReviewed);
    };
  }, [socket]);

  const handleReviewDecision = async (id: number, decision: 'allowed' | 'rejected', note?: string) => {
    try {
      await api.patch(`/ai-interactions/${id}/review`, { decision, note });
      setPendingReviews((prev) => prev.filter((item) => item.id !== id));
      fetchMetrics();
    } catch (err) {
      console.error('Failed to submit review decision:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/metrics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      setError(errorObj.response?.data?.error?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to Load Dashboard"
          description={error || 'An error occurred while fetching system metrics.'}
          action={
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
            >
              Retry Loading
            </button>
          }
        />
      </div>
    );
  }

  const donutData = [
    { name: 'Allowed', value: data.verdictBreakdown.allowed.count },
    { name: 'Restricted', value: data.verdictBreakdown.restricted.count },
    { name: 'Blocked', value: data.verdictBreakdown.blocked.count },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Visual Admin Guide Section */}
      <AdminGuideSection onStartTour={() => setIsTourOpen(true)} />

      {/* Guided Tour Spotlight Overlay */}
      <QuickTourOverlay isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics for LLM prompt submissions, policy enforcement, and threat
            detection.
          </p>
        </div>

        <button
          onClick={() => navigate('/activity')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-medium transition shadow-sm"
        >
          <span>View All Activity Logs</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Live Operational Review Queue */}
      <PendingReviewPanel items={pendingReviews} onReviewDecision={handleReviewDecision} />

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interactions */}
        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Interactions</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-100">{data.totalInteractions}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> +12.4%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">vs previous 14 days</span>
        </Card>

        {/* Allowed % */}
        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Allowed Verdicts</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-emerald-400">
                {data.verdictBreakdown.allowed.percentage}%
              </span>
              <span className="text-xs text-slate-400 ml-2">
                ({data.verdictBreakdown.allowed.count})
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Safe corporate prompts</span>
        </Card>

        {/* Restricted % */}
        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Restricted / Redacted</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-amber-400">
                {data.verdictBreakdown.restricted.percentage}%
              </span>
              <span className="text-xs text-slate-400 ml-2">
                ({data.verdictBreakdown.restricted.count})
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <TrendingDown className="w-3 h-3" /> -2.1%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Sensitive data transformed</span>
        </Card>

        {/* Blocked % */}
        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Blocked Violations</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-extrabold text-rose-400">
                {data.verdictBreakdown.blocked.percentage}%
              </span>
              <span className="text-xs text-slate-400 ml-2">
                ({data.verdictBreakdown.blocked.count})
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              <TrendingDown className="w-3 h-3" /> -1.8%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Critical policy blocks</span>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 14-Day Daily Volume Stacked Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>14-Day Daily Request Volume</CardTitle>
              <CardDescription>Daily prompt traffic broken down by verdict</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.dailyVolume}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRestricted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#colorAllowed)"
                  name="Allowed"
                />
                <Area
                  type="monotone"
                  dataKey="restricted"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="url(#colorRestricted)"
                  name="Restricted"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stackId="1"
                  stroke="#f43f5e"
                  fill="url(#colorBlocked)"
                  name="Blocked"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Verdict Breakdown Donut Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Verdict Distribution</CardTitle>
              <CardDescription>Percentage breakdown of security actions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-4 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">
                  Allowed ({data.verdictBreakdown.allowed.percentage}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">
                  Restricted ({data.verdictBreakdown.restricted.percentage}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">
                  Blocked ({data.verdictBreakdown.blocked.percentage}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Apps & Recent Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Bar Chart for Target Apps */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Top AI Apps Ranking</CardTitle>
              <CardDescription>Request volume by target LLM provider</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.perAppCounts}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis
                  dataKey="app"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Security Alerts Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Recent High & Critical Alerts</CardTitle>
                <CardDescription>Latest restricted and blocked security incidents</CardDescription>
              </div>
              <button
                onClick={() => navigate('/activity')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-slate-800/80">
              {data.recentAlerts.map((alert) => (
                <div key={alert.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <SeverityPill severity={alert.risk_tier} />
                      <StatusBadge status={alert.decision} />
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(alert.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {alert.prompt_summary}
                    </p>
                    <div className="text-[11px] text-slate-500 font-mono">
                      User: <span className="text-slate-300">{alert.user_name}</span> | App:{' '}
                      <span className="text-slate-300">{alert.target_app}</span> | Dept:{' '}
                      <span className="text-slate-300">{alert.department}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/activity?user=${encodeURIComponent(alert.user_name)}`)
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
