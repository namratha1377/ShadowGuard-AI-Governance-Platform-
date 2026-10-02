import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@shadowguard.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { accessToken, refreshToken, user } = res.data.data;
        localStorage.setItem('shadowguard_access_token', accessToken);
        localStorage.setItem('shadowguard_refresh_token', refreshToken);
        localStorage.setItem('shadowguard_user', JSON.stringify(user));

        // Decode JWT role claim or inspect user object
        let role = user?.role;
        if (!role && accessToken) {
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            role = tokenPayload.role;
          } catch {
            role = 'user';
          }
        }

        // Redirect based on role
        if (role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/prompt');
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
      setError(
        errorObj.response?.data?.error?.message ||
          'Invalid email or password. Please check credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Subtle Mesh Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls */}
      <header className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card with Framer Motion Entrance Animation */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 my-10"
      >
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 mb-1 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 dark:from-slate-100 dark:via-slate-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Welcome to ShadowGuard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your organization's AI gateway
          </p>
        </div>

        {/* Inline Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 active:scale-[0.98] mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Link to Signup */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link
              to="/signup"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Self-registration creates employee user accounts. Admin accounts are pre-seeded.
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
          <p className="text-[10px] text-slate-400 font-mono text-center uppercase tracking-wider">
            Quick Demo Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@shadowguard.local')}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-center font-medium"
            >
              Admin (Sarah)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('alex.mercer@shadowguard.local')}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition text-center font-medium"
            >
              Employee (Alex)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
