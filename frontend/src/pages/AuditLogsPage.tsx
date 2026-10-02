import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Filter } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Table, Column } from '../components/ui/Table';
import { SeverityPill } from '../components/ui/SeverityPill';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface AuditLog {
  id: number;
  actor: string;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical' | string;
  ip_address: string;
  created_at: string;
}

import { usePageTitle } from '../hooks/usePageTitle';

export const AuditLogsPage: React.FC = () => {
  usePageTitle('Audit Logs');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [criticalOnly, setCriticalOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit };

      const activeSeverity = criticalOnly ? 'critical' : severityFilter;
      if (activeSeverity) params.severity = activeSeverity;

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, criticalOnly, page, limit]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleToggleCriticalOnly = () => {
    setCriticalOnly(!criticalOnly);
    if (!criticalOnly) {
      setSeverityFilter('critical');
    } else {
      setSeverityFilter('');
    }
    setPage(1);
  };

  const columns: Column<AuditLog>[] = [
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
            second: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      sortable: true,
      render: (item) => <span className="font-medium text-slate-200">{item.actor}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (item) => <span className="font-mono text-indigo-400">{item.action}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (item) => (
        <span className="font-mono text-slate-300 truncate max-w-[200px] block">{item.target}</span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (item) => {
        const mappedSeverity =
          item.severity === 'critical'
            ? 'Critical'
            : item.severity === 'warning'
              ? 'Medium'
              : 'Low';
        return <SeverityPill severity={mappedSeverity} />;
      },
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (item) => <span className="font-mono text-slate-400">{item.ip_address}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of administrative changes, security breaches, and policy updates.
          </p>
        </div>

        {/* Quick Critical Only Toggle */}
        <button
          onClick={handleToggleCriticalOnly}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition flex items-center gap-2 border ${
            criticalOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-glow-rose'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <ShieldAlert
            className={`w-4 h-4 ${criticalOnly ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}
          />
          <span>Critical Events Only {criticalOnly ? '(ACTIVE)' : ''}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-52">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCriticalOnly(e.target.value === 'critical');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSeverityFilter('');
              setCriticalOnly(false);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </Card>

      {/* Main Audit Log Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No Audit Logs Found"
          description="No system audit records matched your filter criteria."
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

export default AuditLogsPage;
