import React, { useState } from 'react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
} from '../lib/firebase';
import { ShieldCheck, Lock, Mail, Key, AlertTriangle, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      if (onClose) onClose();
    } catch (err: any) {
      if (err?.code === 'auth/admin-restricted-operation' || err?.code === 'auth/operation-not-allowed') {
        setError('Email/Password is not enabled on this Firebase project. Please use Sign In with Google.');
      } else {
        const msg = err?.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err?.message || 'Authentication failed';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError('Popup was blocked by the browser. Please allow popups for this window.');
      } else {
        setError(err?.message || 'Google sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-[#111113] border border-slate-800 rounded-lg shadow-2xl overflow-hidden font-mono text-slate-300">
        {/* Header */}
        <div className="bg-[#0A0A0B] text-white p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-tight">
                {isRegister ? 'Register Secure Identity' : 'Authenticate Session'}
              </h2>
              <p className="text-[10px] text-slate-500">
                End-to-end tenant isolation via verified Firebase Auth tokens
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 flex items-center gap-2 text-[10px] text-amber-300">
          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            Strict Token Verification: Client tokens are cryptographically validated server-side.
          </span>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="capitalize leading-relaxed">{error}</span>
            </div>
          )}

          {/* Primary Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-mono uppercase tracking-wider font-bold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-[#111113] px-2 text-slate-500 uppercase tracking-widest font-bold">
                Or Email / Password
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@system.io"
                  className="w-full pl-9 pr-3 py-2 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider font-medium rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {loading
                ? 'Verifying...'
                : isRegister
                ? 'Initialize Private Vault'
                : 'Authenticate & Access'}
            </button>
          </form>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isRegister
                ? 'Already registered? Sign in here'
                : 'New operator? Initialize identity here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
