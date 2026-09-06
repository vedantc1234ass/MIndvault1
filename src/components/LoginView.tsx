import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../lib/firebase';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this tab, or open this preview in a new window.');
      } else if (err?.code === 'auth/cancelled-popup-request' || err?.code === 'auth/popup-closed-by-user') {
        setError('Sign in cancelled. Please click "Sign In with Google" to proceed.');
      } else {
        setError(err?.message || 'Google authentication failed or was cancelled.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Email Auth error:', err);
      if (
        err?.code === 'auth/admin-restricted-operation' ||
        err?.code === 'auth/operation-not-allowed'
      ) {
        setError(
          'Email/Password sign-in is disabled in this Firebase project. Google Sign-In is the configured provider — please click "Sign In with Google" above.'
        );
      } else {
        setError(err?.message || 'Authentication failed. Please check credentials or use Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-1">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-white font-mono tracking-tight uppercase">MINDVAULT</h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ZERO-TRUST AI
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Secure Personal AI Second Brain with per-user Firestore isolation, RAG semantic search, and server-side Secret Manager protection.
          </p>
        </div>

        {/* Primary Auth Card */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Primary Recommended Auth: Google Sign-In */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Verified Firebase Identity
              </span>
              <span className="text-emerald-400 text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
                Pre-configured
              </span>
            </div>

            <button
              id="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating with Google...' : 'Sign In with Google'}</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center font-mono leading-relaxed">
              Uses OAuth 2.0 & Firebase ID Token verification to guarantee database isolation under your unique UID.
            </p>
          </div>

          {/* Collapsible Secondary Option: Custom Email / Password */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowEmailAuth(!showEmailAuth)}
              className="w-full flex items-center justify-between py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Custom Email/Password Login
              </span>
              {showEmailAuth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEmailAuth && (
              <div className="mt-3 space-y-4 pt-2">
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
                  ⚠️ Note: Email/Password must be enabled in the Firebase Console under Authentication &gt; Sign-in method.
                </div>

                <div className="flex border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`flex-1 pb-2 text-xs font-mono font-medium transition-colors ${
                      tab === 'login'
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className={`flex-1 pb-2 text-xs font-mono font-medium transition-colors ${
                      tab === 'register'
                        ? 'text-emerald-400 border-b-2 border-emerald-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {loading ? 'Processing...' : tab === 'login' ? 'Sign In with Email' : 'Register Account'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Security Pillars Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
          <div className="p-3 bg-[#111113] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-bold">Per-User Firestore</p>
              <p className="text-slate-500 text-[10px]">Strict subcollection rules block cross-tenant reads</p>
            </div>
          </div>
          <div className="p-3 bg-[#111113] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-bold">Secret Manager</p>
              <p className="text-slate-500 text-[10px]">Gemini API keys shielded on server gateway</p>
            </div>
          </div>
          <div className="p-3 bg-[#111113] border border-slate-800 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-bold">Ask My Journal RAG</p>
              <p className="text-slate-500 text-[10px]">Strict XML prompt demarcation defense</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
