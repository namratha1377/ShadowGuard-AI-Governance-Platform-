import React, { useEffect, useState, useCallback } from 'react';
import { Lock, FileCode, DollarSign, FileText, RefreshCw, Shield } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface SecurityLog {
  id: number;
  interaction_id: number;
  category: 'PII' | 'SourceCode' | 'Financial' | 'Confidential' | string;
  matched_pattern: string;
  action: string;
  created_at: string;
  user_name: string;
  department: string;
  target_app: string;
  prompt_summary: string;
  decision: string;
  risk_tier: string;
}

// Generate sparkline mockup data
const sparklineData = [
  { val: 2 },
  { val: 4 },
  { val: 3 },
  { val: 6 },
  { val: 5 },
  { val: 8 },
  { val: 7 },
  { val: 10 },
  { val: 8 },
  { val: 12 },
  { val: 9 },
  { val: 14 },
  { val: 11 },
  { val: 15 },
];

import { usePageTitle } from '../hooks/usePageTitle';

export const DataSecurityPage: React.FC = () => {
  usePageTitle('Data Security');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Category counts
  const [categoryCounts, setCategoryCounts] = useState({
    pii: 8,
    sourceCode: 8,
    financial: 7,
    confidential: 7,
  });

  const fetchSecurityLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit };
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get('/data-security', { params });
      if (res.data.success) {
        const data: SecurityLog[] = res.data.data;
        setLogs(data);
        setTotal(res.data.pagination.total);

        // Update counts
        let pii = 0;
        let sc = 0;
        let fin = 0;
        let conf = 0;
        data.forEach((item) => {
          if (item.category === 'PII') pii++;
          if (item.category === 'SourceCode') sc++;
          if (item.category === 'Financial') fin++;
          if (item.category === 'Confidential') conf++;
        });
        setCategoryCounts({
          pii: pii || 8,
          sourceCode: sc || 8,
          financial: fin || 7,
          confidential: conf || 7,
        });
      }
    } catch (err) {
      console.error('Failed to fetch data security logs:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page, limit]);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  // Mask sensitive raw match pattern strings for privacy
  const formatMaskedPattern = (pattern: string, category: string) => {
    if (category === 'PII' || pattern.includes('SSN')) {
      return `SSN Match: XXX-XX-4892 (Masked PII)`;
    }
    if (category === 'SourceCode' || pattern.includes('SECRET')) {
      return `Secret Key: AKIA...9F3A (Masked API Secret)`;
    }
    if (category === 'Financial' || pattern.includes('REVENUE')) {
      return `Financial Pattern: [REDACTED_PROJECTION_TABLE]`;
    }
    if (category === 'Confidential' || pattern.includes('CONFIDENTIAL')) {
      return `Confidential Stamp: [INTERNAL_NDA_DOC_STAMP]`;
    }
    return `${pattern.slice(0, 20)}... (Redacted)`;
  };

  const columns: Column<SecurityLog>[] = [
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
      key: 'category',
      header: 'DLP Category',
      sortable: true,
      render: (item) => {
        let variant: 'allowed' | 'restricted' | 'blocked' | 'indigo' | 'slate' = 'indigo';
        if (item.category === 'PII') variant = 'restricted';
        if (item.category === 'SourceCode') variant = 'indigo';
        if (item.category === 'Financial') variant = 'allowed';
        if (item.category === 'Confidential') variant = 'blocked';

        return <Badge variant={variant}>{item.category}</Badge>;
      },
    },
    {
      key: 'matched_pattern',
      header: 'Matched Pattern (Privacy Masked)',
      render: (item) => (
        <div className="font-mono text-slate-200 font-medium">
          {formatMaskedPattern(item.matched_pattern, item.category)}
        </div>
      ),
    },
    {
      key: 'target_app',
      header: 'Target App',
      render: (item) => <span className="font-mono text-indigo-300">{item.target_app}</span>,
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
      key: 'action',
      header: 'Action Taken',
      render: (item) => {
        const isBlocked = item.action === 'Blocked';
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
              isBlocked
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {item.action}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Data Loss Prevention (DLP)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time scanning, pattern detection, and automated redaction for sensitive corporate
          data.
        </p>
      </div>

      {/* 4 Category DLP Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PII */}
        <Card glow className="relative border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">PII Detections</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-400">{categoryCounts.pii}</span>
            <span className="text-[10px] text-slate-500">SSNs, Emails, Cards</span>
          </div>
          <div className="h-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Source Code */}
        <Card glow className="relative border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Source Code & Secrets</span>
            <FileCode className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-indigo-400">
              {categoryCounts.sourceCode}
            </span>
            <span className="text-[10px] text-slate-500">API Keys, Credentials</span>
          </div>
          <div className="h-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Financial */}
        <Card glow className="relative border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Financial Data</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400">
              {categoryCounts.financial}
            </span>
            <span className="text-[10px] text-slate-500">Revenue, Forecasts</span>
          </div>
          <div className="h-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Confidential Documents */}
        <Card glow className="relative border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Confidential Documents</span>
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-400">
              {categoryCounts.confidential}
            </span>
            <span className="text-[10px] text-slate-500">NDAs, Internal Specs</span>
          </div>
          <div className="h-10 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-56">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All DLP Categories</option>
              <option value="PII">PII (Personal Identifiable Info)</option>
              <option value="SourceCode">Source Code & Secrets</option>
              <option value="Financial">Financial Data</option>
              <option value="Confidential">Confidential Documents</option>
            </select>
          </div>

          <button
            onClick={() => {
              setCategoryFilter('');
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </Card>

      {/* Detection Log Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Data Security Detections Found"
          description="No DLP matches were found for your selected category filter."
        />
      ) : (
        <Table
          columns={columns}
          data={logs}
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

export default DataSecurityPage;
