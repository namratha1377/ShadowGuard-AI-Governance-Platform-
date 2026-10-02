import React, { useEffect, useState, useCallback } from 'react';
import { FileText, ShieldCheck, AlertCircle, Edit, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

interface Policy {
  id: number;
  name: string;
  description: string;
  scope: string;
  rule_count: number;
  violation_count: number;
  status: 'enabled' | 'disabled';
  updated_at: string;
}

import { usePageTitle } from '../hooks/usePageTitle';

export const PoliciesPage: React.FC = () => {
  usePageTitle('Policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Modal state
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editScope, setEditScope] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Check logged in user role from localStorage
  const userJson = localStorage.getItem('shadowguard_user');
  const user = userJson ? JSON.parse(userJson) : { role: 'viewer' };
  const isAdmin = user.role === 'admin';

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/policies');
      if (res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      setError(errorObj.response?.data?.error?.message || 'Failed to load security policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Optimistic Toggle Handler
  const handleTogglePolicy = async (policy: Policy) => {
    if (!isAdmin) return;

    const newStatus: 'enabled' | 'disabled' = policy.status === 'enabled' ? 'disabled' : 'enabled';

    // Optimistic UI Update
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policy.id ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p
      )
    );

    try {
      const res = await api.patch(`/policies/${policy.id}`, { status: newStatus });
      if (res.data.success) {
        // Reconcile with server response
        setPolicies((prev) => prev.map((p) => (p.id === policy.id ? res.data.data : p)));
      }
    } catch (err) {
      console.error('Failed to update policy status:', err);
      // Revert optimistic change on failure
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, status: policy.status } : p))
      );
    }
  };

  const handleOpenEditor = (policy: Policy) => {
    setSelectedPolicy(policy);
    setEditDescription(policy.description);
    setEditScope(policy.scope);
    setSaveSuccess(false);
  };

  const handleSavePolicyEdit = async () => {
    if (!selectedPolicy || !isAdmin) return;

    try {
      setSavingEdit(true);
      const res = await api.patch(`/policies/${selectedPolicy.id}`, {
        status: selectedPolicy.status,
      });
      if (res.data.success) {
        const updated = {
          ...selectedPolicy,
          description: editDescription,
          scope: editScope,
          updated_at: new Date().toISOString(),
        };

        setPolicies((prev) => prev.map((p) => (p.id === selectedPolicy.id ? updated : p)));
        setSaveSuccess(true);
        setTimeout(() => {
          setSelectedPolicy(null);
          setSaveSuccess(false);
        }, 800);
      }
    } catch (err) {
      console.error('Failed to save policy edit:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security Policies</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated DLP rules, enforcement scopes, and violation thresholds.
          </p>
        </div>

        {!isAdmin && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4" />
            <span>Read-Only Mode ({user.role.toUpperCase()})</span>
          </div>
        )}
      </div>

      {/* Policies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={FileText}
          title="Error Loading Policies"
          description={error}
          action={
            <button
              onClick={fetchPolicies}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
            >
              Retry
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy) => {
            const isEnabled = policy.status === 'enabled';

            return (
              <Card
                key={policy.id}
                glow
                className="relative flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${isEnabled ? 'bg-indigo-600/15 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{policy.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Scope: {policy.scope}
                        </span>
                      </div>
                    </div>

                    {/* Optimistic Status Toggle */}
                    <div className="flex items-center gap-2">
                      <Toggle
                        enabled={isEnabled}
                        onChange={() => handleTogglePolicy(policy)}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {policy.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">
                      Rules:{' '}
                      <span className="text-slate-200 font-semibold">{policy.rule_count}</span>
                    </span>
                    <span className="text-slate-400">
                      Violations:{' '}
                      <span className="text-rose-400 font-semibold">{policy.violation_count}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenEditor(policy)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isAdmin ? 'Edit Policy' : 'Inspect'}</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Policy Editor Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={!!selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          title={`Edit Policy: ${selectedPolicy.name}`}
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              {isAdmin && (
                <button
                  onClick={handleSavePolicyEdit}
                  disabled={savingEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>{savingEdit ? 'Saving...' : 'Save Policy Changes'}</span>
                  )}
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-mono block mb-1">Policy Name</label>
              <input
                type="text"
                disabled
                value={selectedPolicy.name}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-400 font-mono opacity-70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-slate-400 font-mono block mb-1">Scope</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={editScope}
                onChange={(e) => setEditScope(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            <div>
              <label className="text-slate-400 font-mono block mb-1">Description</label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Total Rules</span>
                <span className="text-slate-200 text-sm font-semibold">
                  {selectedPolicy.rule_count} Rules
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Logged Violations</span>
                <span className="text-rose-400 text-sm font-semibold">
                  {selectedPolicy.violation_count} Hits
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PoliciesPage;
