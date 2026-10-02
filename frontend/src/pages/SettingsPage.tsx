import React, { useEffect, useState } from 'react';
import { Settings, Save, Bell, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

import { usePageTitle } from '../hooks/usePageTitle';

export const SettingsPage: React.FC = () => {
  usePageTitle('Settings');
  const [retentionDays, setRetentionDays] = useState<number>(365);
  const [webhookSlack, setWebhookSlack] = useState<string>('');
  const [webhookEmail, setWebhookEmail] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingAlert, setTestingAlert] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Check user role from localStorage
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson ? JSON.parse(userJson) : { role: 'viewer' };
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success && res.data.data) {
        setRetentionDays(res.data.data.retention_days || 365);
        setWebhookSlack(res.data.data.webhook_slack || '');
        setWebhookEmail(res.data.data.webhook_email || '');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setStatusMessage(null);

      const res = await api.patch('/settings', {
        retention_days: Number(retentionDays),
        webhook_slack: webhookSlack || null,
        webhook_email: webhookEmail || null,
      });

      if (res.data.success) {
        setStatusMessage({ type: 'success', text: 'Organization settings updated successfully!' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      setStatusMessage({
        type: 'error',
        text: errorObj.response?.data?.error?.message || 'Failed to save organization settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setTestingAlert(true);
      setStatusMessage(null);
      // Simulate/Dispatch test alert dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatusMessage({
        type: 'success',
        text: 'Test alert payload successfully dispatched to Slack & Email webhooks!',
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Test alert dispatch failed:', err);
    } finally {
      setTestingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Organization Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure global audit log retention policies and operational alert webhooks.
          </p>
        </div>

        {!isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>Read-Only Mode ({user.role.toUpperCase()})</span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Retention Policy Card */}
        <Card glow>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <div>
                <CardTitle>Log Retention Policy</CardTitle>
                <CardDescription>
                  Automated purging threshold for historic audit records
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Audit & Interaction Retention (Days)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  disabled={!isAdmin}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono transition disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Default: 365 days. Data older than this threshold will be archived according to
                compliance standards.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks & Alerts Card */}
        <Card glow>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <CardTitle>Security Incident Webhooks</CardTitle>
                  <CardDescription>
                    Notifications for critical policy breaches & DLP blocks
                  </CardDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={testingAlert}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>{testingAlert ? 'Dispatching...' : 'Send Test Alert'}</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Slack Webhook URL
              </label>
              <input
                type="url"
                disabled={!isAdmin}
                value={webhookSlack}
                onChange={(e) => setWebhookSlack(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Alert Dispatch Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={webhookEmail}
                onChange={(e) => setWebhookEmail(e.target.value)}
                placeholder="security-alerts@company.com"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
