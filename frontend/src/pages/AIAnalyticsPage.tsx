import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock3,
  RefreshCw,
  BarChart3,
  Database,
  Layers3,
  BrainCircuit,
} from 'lucide-react';

import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { usePageTitle } from '../hooks/usePageTitle';

interface DailyVolume {
  date: string;
  allowed: number;
  restricted: number;
  blocked: number;
}

interface DepartmentBreakdown {
  department: string;
  allowed: number;
  restricted: number;
  blocked: number;
  total: number;
}

interface ProviderUsage {
  app: string;
  count: number;
}

interface SecurityEvent {
  category: string;
  count: number;
  restricted: number;
  blocked: number;
}

interface RiskDistribution {
  tier: string;
  count: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
}

interface AnalyticsData {
  totalInteractions: number;
  allowedRequests: number;
  restrictedRequests: number;
  blockedRequests: number;
  pendingReview: number;

  dailyVolume: DailyVolume[];
  departmentBreakdown: DepartmentBreakdown[];
  providerUsage: ProviderUsage[];
  securityEvents: SecurityEvent[];
  riskDistribution: RiskDistribution[];
  categoryBreakdown: CategoryBreakdown[];
}

const chartTextColor = '#94a3b8';
const gridColor = '#1e293b';
const tooltipTheme = 'dark';

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

const normalizeSecurityCategory = (category: string) => {
  switch (category) {
    case 'SourceCode':
      return 'Source Code';
    default:
      return category;
  }
};

export const AIAnalyticsPage: React.FC = () => {
  usePageTitle('AI Analytics');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await api.get('/dashboard/analytics');

      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error('Analytics data could not be loaded.');
      }
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          data?: {
            error?: {
              message?: string;
            };
          };
        };
        message?: string;
      };

      setError(
        errorObj.response?.data?.error?.message ||
          errorObj.message ||
          'Failed to load AI analytics.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const dailyChart = useMemo(() => {
    if (!data) {
      return {
        categories: [],
        series: [],
      };
    }

    return {
      categories: data.dailyVolume.map((item) => formatDate(item.date)),
      series: [
        {
          name: 'Allowed',
          data: data.dailyVolume.map((item) => item.allowed),
        },
        {
          name: 'Restricted',
          data: data.dailyVolume.map((item) => item.restricted),
        },
        {
          name: 'Blocked',
          data: data.dailyVolume.map((item) => item.blocked),
        },
      ],
    };
  }, [data]);

  const dailyChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 340,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      animations: {
        enabled: true,
      },
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#10b981', '#f59e0b', '#f43f5e'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.04,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      categories: dailyChart.categories,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: chartTextColor,
      },
      fontSize: '11px',
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const departmentChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 330,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      stacked: true,
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#10b981', '#f59e0b', '#f43f5e'],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '52%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      categories: data?.departmentBreakdown.map((item) => item.department) || [],
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: chartTextColor,
      },
      fontSize: '11px',
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const providerChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 330,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#6366f1'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '48%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '11px',
        },
      },
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const decisionChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 310,
      background: 'transparent',
    },
    theme: {
      mode: tooltipTheme,
    },
    labels: ['Allowed', 'Restricted', 'Blocked'],
    colors: ['#10b981', '#f59e0b', '#f43f5e'],
    stroke: {
      width: 4,
      colors: ['#0f172a'],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: chartTextColor,
      },
      fontSize: '11px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              color: chartTextColor,
              fontSize: '11px',
            },
            value: {
              color: '#f8fafc',
              fontSize: '20px',
              fontWeight: 700,
            },
            total: {
              show: true,
              label: 'Total Requests',
              color: chartTextColor,
              formatter: () => `${data?.totalInteractions ?? 0}`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const riskChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 310,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#8b5cf6'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true,
        barHeight: '50%',
      },
    },
    colors: ['#22c55e', '#eab308', '#f97316', '#ef4444'],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        colors: ['#ffffff'],
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      categories: data?.riskDistribution.map((item) => item.tier) || [],
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '11px',
        },
      },
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const securityChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 310,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      stacked: true,
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#f59e0b', '#f43f5e'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '48%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '11px',
        },
      },
    },
    legend: {
      position: 'top',
      labels: {
        colors: chartTextColor,
      },
      fontSize: '11px',
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  const categoryChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 340,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    theme: {
      mode: tooltipTheme,
    },
    colors: ['#06b6d4'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '52%',
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        colors: ['#ffffff'],
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
    },
    xaxis: {
      min: 0,
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '10px',
        },
      },
    },
    tooltip: {
      theme: tooltipTheme,
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to Load AI Analytics"
          description={error || 'Analytics data could not be retrieved.'}
          action={
            <button
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
            >
              Retry Loading
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            AI Analytics
          </h1>

          <p className="text-xs text-slate-400 mt-0.5">
            Domain-specific analytics for AI usage, governance decisions, and security events.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total AI Interactions
            </span>

            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-100">
              {data.totalInteractions}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 mt-1 block">
            Recorded AI requests
          </span>
        </Card>

        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Allowed Requests
            </span>

            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-400">
              {data.allowedRequests}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 mt-1 block">
            Passed governance controls
          </span>
        </Card>

        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Restricted Requests
            </span>

            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-400">
              {data.restrictedRequests}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 mt-1 block">
            Sensitive requests restricted
          </span>
        </Card>

        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Blocked Requests
            </span>

            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-400">
              {data.blockedRequests}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 mt-1 block">
            Requests stopped by policy
          </span>
        </Card>

        <Card glow className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Pending Review
            </span>

            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-violet-400">
              {data.pendingReview}
            </span>
          </div>

          <span className="text-[10px] text-slate-500 mt-1 block">
            Awaiting administrator action
          </span>
        </Card>
      </div>

      {/* Request Trend + Decision Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>AI Request Volume</CardTitle>
              <CardDescription>
                Fourteen-day request activity by governance decision
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="h-96 pt-2">
            <Chart
              type="area"
              height="100%"
              options={dailyChartOptions}
              series={dailyChart.series}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Governance Decisions</CardTitle>
              <CardDescription>
                Distribution of AI governance outcomes
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="h-96 flex items-center justify-center">
            <Chart
              type="donut"
              height={320}
              options={decisionChartOptions}
              series={[
                data.allowedRequests,
                data.restrictedRequests,
                data.blockedRequests,
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Department + Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>

              <div>
                <CardTitle>AI Usage by Department</CardTitle>
                <CardDescription>
                  Governance outcomes across organizational departments
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-96 pt-2">
            <Chart
              type="bar"
              height="100%"
              options={departmentChartOptions}
              series={[
                {
                  name: 'Allowed',
                  data: data.departmentBreakdown.map((item) => item.allowed),
                },
                {
                  name: 'Restricted',
                  data: data.departmentBreakdown.map((item) => item.restricted),
                },
                {
                  name: 'Blocked',
                  data: data.departmentBreakdown.map((item) => item.blocked),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <BrainCircuit className="w-4 h-4" />
              </div>

              <div>
                <CardTitle>AI Provider Usage</CardTitle>
                <CardDescription>
                  Requests by external AI application
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-96 pt-2">
            <Chart
              type="bar"
              height="100%"
              options={{
                ...providerChartOptions,
                xaxis: {
                  ...providerChartOptions.xaxis,
                  categories: data.providerUsage.map((item) => item.app),
                },
              }}
              series={[
                {
                  name: 'Requests',
                  data: data.providerUsage.map((item) => item.count),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Security Events + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Database className="w-4 h-4" />
              </div>

              <div>
                <CardTitle>Security Events by Category</CardTitle>
                <CardDescription>
                  Sensitive-data detections associated with AI interactions
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-96 pt-2">
            <Chart
              type="bar"
              height="100%"
              options={{
                ...securityChartOptions,
                xaxis: {
                  ...securityChartOptions.xaxis,
                  categories: data.securityEvents.map((item) =>
                    normalizeSecurityCategory(item.category)
                  ),
                },
              }}
              series={[
                {
                  name: 'Restricted',
                  data: data.securityEvents.map((item) => item.restricted),
                },
                {
                  name: 'Blocked',
                  data: data.securityEvents.map((item) => item.blocked),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                <Layers3 className="w-4 h-4" />
              </div>

              <div>
                <CardTitle>Risk Tier Distribution</CardTitle>
                <CardDescription>
                  AI interactions grouped by assessed risk tier
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-96 pt-2">
            <Chart
              type="bar"
              height="100%"
              options={riskChartOptions}
              series={[
                {
                  name: 'Interactions',
                  data: data.riskDistribution.map((item) => item.count),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Prompt Category Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>

            <div>
              <CardTitle>AI Prompt Category Distribution</CardTitle>
              <CardDescription>
                Most common categories of AI requests submitted through ShadowGuard
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-96 pt-2">
          <Chart
            type="bar"
            height="100%"
            options={{
              ...categoryChartOptions,
              yaxis: {
                ...categoryChartOptions.yaxis,
                categories: data.categoryBreakdown.map((item) => item.category),
              },
            }}
            series={[
              {
                name: 'Requests',
                data: data.categoryBreakdown.map((item) => item.count),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Analytics explanation */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-200">
              Analytics Scope
            </p>

            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              These analytics summarize AI interaction volume, governance decisions,
              organizational usage, security detections, risk distribution, and prompt
              categories recorded by ShadowGuard. Individual request investigation
              remains available through AI Activity and Audit Logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsPage;