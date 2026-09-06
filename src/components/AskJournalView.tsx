import React, { useState } from 'react';
import { UserProfile, JournalEntry, ConversationSummary, AskJournalInteraction } from '../types';
import {
  Sparkles,
  Send,
  BookOpen,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  HelpCircle,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import { getCurrentUserIdToken, getUserSummariesCollection } from '../lib/firebase';
import { getDocs, query, orderBy, limit } from 'firebase/firestore';

interface AskJournalViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onOpenEditor?: () => void;
}

export const AskJournalView: React.FC<AskJournalViewProps> = ({
  user,
  entries,
  onOpenEditor,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AskJournalInteraction[]>([]);

  const sampleQuestions = [
    'What have I been working on recently and what progress did I make?',
    'What recurring goals or personal habits have I recorded over time?',
    'What challenges, stressors, or blockers have appeared most in my notes?',
    'Summarize my main breakthroughs, milestones, and moments of gratitude',
    'What were the primary themes and action items discussed in my chats?',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    setError(null);
    setLoading(true);

    try {
      const token = await getCurrentUserIdToken();
      if (!token) throw new Error('Authorization token not found. Please log in.');

      // Fetch user's conversation summaries to combine with journal entries
      const sumCol = getUserSummariesCollection(user.uid);
      const sumSnap = await getDocs(query(sumCol, orderBy('createdAt', 'desc'), limit(10)));
      const summaries: ConversationSummary[] = [];
      sumSnap.forEach((doc) => {
        summaries.push({ id: doc.id, ...(doc.data() as any) });
      });

      // Send to protected server-side endpoint
      const res = await fetch('/api/ai/ask-my-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: q,
          entries: entries.slice(0, 20),
          summaries: summaries,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const interaction: AskJournalInteraction = {
        id: `ask_${Date.now()}`,
        question: q,
        answer: data.answer,
        referencedEntriesCount: data.referencedEntriesCount || entries.length,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setHistory([interaction, ...history]);
      setQuestion('');
    } catch (err: any) {
      console.error('Ask My Journal error:', err);
      setError(err.message || 'Unable to query journal history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Header */}
      <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-tight">
                  Ask My Journal
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  IDEATHON ORIGINAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ask Gemini questions across your personal journal entries and conversation summaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 bg-[#0A0A0B] border border-slate-800 px-2.5 py-1 rounded">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              {entries.length} entries loaded in vault
            </span>
          </div>
        </div>

        {/* Security Architecture Pipeline Visualizer */}
        <div className="p-3.5 bg-[#0A0A0B] border border-slate-800/80 rounded-lg font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1.5">
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-Trust Execution Pipeline
            </span>
            <span className="text-[10px] text-slate-500">Defense-in-Depth</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 bg-[#111113] border border-slate-800 rounded">
              <span className="text-emerald-400 font-bold block mb-0.5">1. Auth Check</span>
              <span className="text-slate-400">Bearer token verified; extracts authenticated UID</span>
            </div>
            <div className="p-2 bg-[#111113] border border-slate-800 rounded">
              <span className="text-emerald-400 font-bold block mb-0.5">2. Scoped Read</span>
              <span className="text-slate-400">Retrieves only user's isolated vault records</span>
            </div>
            <div className="p-2 bg-[#111113] border border-slate-800 rounded">
              <span className="text-emerald-400 font-bold block mb-0.5">3. XML Demarcation</span>
              <span className="text-slate-400">Frames entries as untrusted data against injection</span>
            </div>
            <div className="p-2 bg-[#111113] border border-slate-800 rounded">
              <span className="text-emerald-400 font-bold block mb-0.5">4. Safe Synthesis</span>
              <span className="text-slate-400">Gemini answers citing entry dates and evidence</span>
            </div>
          </div>
        </div>

        {/* Query Input Box */}
        <div className="space-y-3 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your past ideas, goals, breakthroughs, or recurring thoughts..."
                disabled={loading}
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Synthesizing...' : 'Query Vault'}</span>
            </button>
          </form>

          {/* Preset Prompts */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
              Suggested Second-Brain Inquiries:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  disabled={loading}
                  className="text-left text-[11px] font-mono bg-[#0A0A0B] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-6 bg-[#111113] border border-slate-800 rounded-xl flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-white uppercase tracking-wider">
              CONSULTING ISOLATED JOURNAL ARCHIVE...
            </p>
            <p className="text-slate-500 text-[11px]">
              Verifying user UID scope, framing untrusted vault entries, and synthesizing answer via server-side Gemini 2.5 Flash...
            </p>
          </div>
        </div>
      )}

      {/* Answer Stream */}
      <div className="space-y-4">
        {history.length === 0 && !loading && (
          <div className="text-center py-12 bg-[#111113] border border-dashed border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              No queries yet. Select a suggested inquiry above or ask any question to uncover patterns across your private thoughts and reflections.
            </p>
            {entries.length === 0 && (
              <p className="text-[11px] text-amber-400/90">
                Notice: Your journal vault currently has 0 entries. Add a starter entry in the Journal tab to get richer insights.
              </p>
            )}
          </div>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs shadow-sm"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-bold text-slate-200">Question: "{item.question}"</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>{item.referencedEntriesCount} sources analyzed</span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Answer Body */}
            <div className="p-4 bg-[#0A0A0B] border border-slate-800/80 rounded-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
              {item.answer}
            </div>

            {/* Verification Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Evidence grounded from isolated user vault
              </span>
              <span>Demarcated inside XML boundaries</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
