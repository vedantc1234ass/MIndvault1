import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { JournalEntry } from '../types';
import { getCurrentUserIdToken, getUserSummariesCollection } from '../lib/firebase';
import { addDoc } from 'firebase/firestore';
import {
  Sparkles,
  X,
  ShieldCheck,
  Brain,
  AlertTriangle,
  BookmarkCheck,
  RefreshCw,
} from 'lucide-react';

interface AiReflectionModalProps {
  uid: string;
  entries: JournalEntry[];
  isOpen: boolean;
  onClose: () => void;
  onSavedSummary?: () => void;
}

const FOCUS_AREAS = [
  'General Emotional Clarity & Equilibrium',
  'Resilience & Navigating Challenges',
  'Gratitude, Peace & Grounding',
  'Actionable Goals & Personal Growth',
];

export const AiReflectionModal: React.FC<AiReflectionModalProps> = ({
  uid,
  entries,
  isOpen,
  onClose,
  onSavedSummary,
}) => {
  const [selectedFocus, setSelectedFocus] = useState(FOCUS_AREAS[0]);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerateReflection = async () => {
    if (!entries || entries.length === 0) {
      setError('You must have at least one journal entry to generate an AI reflection.');
      return;
    }

    setLoading(true);
    setError(null);
    setReflection(null);
    setSaved(false);

    try {
      const idToken = await getCurrentUserIdToken();
      if (!idToken) {
        throw new Error('Unauthenticated: Unable to obtain verified Firebase ID token.');
      }

      const payload = {
        focusArea: selectedFocus,
        entries: entries.slice(0, 15).map((e) => ({
          title: e.title,
          content: e.content,
          mood: e.mood,
          createdAt: e.createdAt,
        })),
      };

      const res = await fetch('/api/ai/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      setReflection(data.reflection);
    } catch (err: any) {
      console.error('[AI Reflection Client Error]:', err);
      setError(err.message || 'Failed to generate AI reflection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!reflection || !uid) return;
    try {
      const colRef = getUserSummariesCollection(uid);
      await addDoc(colRef, {
        userId: uid,
        period: 'ad-hoc',
        focusArea: selectedFocus,
        insightText: reflection,
        analyzedCount: entries.length,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      if (onSavedSummary) onSavedSummary();
    } catch (err: any) {
      setError('Failed to save reflection to Firestore: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-[#111113] border border-slate-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-300 font-mono">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0A0A0B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/40">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-tight">
                Server-Side AI Reflection Studio
              </h3>
              <p className="text-[10px] text-slate-500">
                Protected by Verified ID Token & XML Isolation Demarcation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Shield Banner */}
        <div className="bg-purple-950/30 border-b border-purple-800/40 px-5 py-2 flex items-center gap-2 text-xs text-purple-300">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>
            Zero Secret Exposure: Gemini API key never leaves backend server. Inputs are strictly bounded by untrusted-content delimiters.
          </span>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Configuration */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Reflection Focus Lens
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FOCUS_AREAS.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => setSelectedFocus(focus)}
                  className={`p-3 rounded border text-left text-xs font-mono transition-all cursor-pointer ${
                    selectedFocus === focus
                      ? 'bg-purple-950/40 text-purple-200 border-purple-600/60 shadow-xs'
                      : 'bg-[#0A0A0B] text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-slate-400">
            <span>
              Eligible journal entries in scope:{' '}
              <strong className="text-white">{entries.length}</strong> (Capped at 15 most recent for optimal context window)
            </span>
            <button
              onClick={handleGenerateReflection}
              disabled={loading || entries.length === 0}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Synthesize
                </>
              )}
            </button>
          </div>

          {/* AI Result View */}
          {reflection && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  Gemini Synthesis
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Isolated to UID: {uid.slice(0, 8)}...
                </span>
              </div>

              <div className="p-4 bg-[#0A0A0B] border border-slate-800 rounded text-slate-200 text-xs leading-relaxed max-h-96 overflow-y-auto font-sans">
                <div className="markdown-body prose prose-invert prose-xs max-w-none">
                  <Markdown>{reflection}</Markdown>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveToVault}
                  disabled={saved}
                  className={`px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    saved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  {saved ? 'Saved to Private Vault' : 'Save to Firestore'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0A0A0B] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Protected against Cross-User Data Leakage & Prompt Injection attacks</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
