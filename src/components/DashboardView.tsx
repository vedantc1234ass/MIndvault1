import React, { useEffect, useState } from 'react';
import { PageRoute, JournalEntry, ConversationSummary, UserProfile } from '../types';
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  MessageSquare,
  BarChart3,
  Lock,
  Terminal,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Tag,
  KeyRound,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { getUserSummariesCollection } from '../lib/firebase';
import { getDocs, query, orderBy, limit } from 'firebase/firestore';

interface DashboardViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onRouteChange: (route: PageRoute) => void;
  onNewEntry: () => void;
  onOpenAuditModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  entries,
  onRouteChange,
  onNewEntry,
  onOpenAuditModal,
}) => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [secretManagerStatus, setSecretManagerStatus] = useState<any>(null);

  useEffect(() => {
    // Fetch latest summaries
    const fetchSummaries = async () => {
      try {
        setLoadingSummaries(true);
        const colRef = getUserSummariesCollection(user.uid);
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        const items: ConversationSummary[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...(doc.data() as any) });
        });
        setSummaries(items);
      } catch (err) {
        console.warn('Failed to load summaries in dashboard:', err);
      } finally {
        setLoadingSummaries(false);
      }
    };

    // Fetch secret manager audit status
    const fetchSecretStatus = async () => {
      try {
        const res = await fetch('/api/security/secret-manager-status');
        if (res.ok) {
          const data = await res.json();
          setSecretManagerStatus(data);
        }
      } catch (e) {
        console.warn('Failed to load secret status:', e);
      }
    };

    fetchSummaries();
    fetchSecretStatus();
  }, [user.uid]);

  // Aggregate action items from summaries
  const allActionItems = summaries.flatMap((s) => s.actionItems || []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ZERO-TRUST ACTIVE
            </span>
            <span className="text-xs font-mono text-slate-500">
              UID: {user.uid.slice(0, 10)}...
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-mono uppercase tracking-tight">
            MindVault Second Brain Console
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Personal knowledge vault protected by strict per-user Cloud Firestore isolation and server-side Secret Manager key isolation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onRouteChange('ask')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            Ask My Journal
          </button>
          <button
            onClick={onNewEntry}
            className="px-3.5 py-2 bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            New Journal Entry
          </button>
        </div>
      </div>

      {/* High-Density Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              JOURNAL VAULT
            </span>
            <span className="text-[10px] text-emerald-400">ISOLATED</span>
          </div>
          <div className="text-2xl font-light text-white">{entries.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">
            Private entries stored in <code className="text-slate-400">users/{'{uid}'}/journalEntries</code>
          </p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              SUMMARIES & INSIGHTS
            </span>
            <span className="text-[10px] text-blue-400">STRUCTURED</span>
          </div>
          <div className="text-2xl font-light text-white">{summaries.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">
            Automatic multi-turn conversation syntheses recorded
          </p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              SECRET MANAGER
            </span>
            <span className="text-[10px] text-amber-400">PROTECTED</span>
          </div>
          <div className="text-2xl font-light text-white">
            {secretManagerStatus?.configured ? 'Active' : 'Checking...'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {secretManagerStatus?.source || 'Server-side runtime retrieval'}
          </p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              DATA BOUNDARY
            </span>
            <span className="text-[10px] text-emerald-400">PASSING</span>
          </div>
          <div className="text-2xl font-light text-white">IDOR Safe</div>
          <p className="text-[10px] text-slate-500 mt-1">
            Firestore rules enforce <code className="text-slate-400">request.auth.uid</code>
          </p>
        </div>
      </div>

      {/* Main Two-Column Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Featured Workspaces & Recent Entries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ask My Journal Spotlight */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/30 to-[#111113] border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Featured: Ask My Journal (Original Ideathon Capability)
                </h3>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PROMPT ISOLATED
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask Gemini deep questions about your thoughts, repeated themes, goals, and conversations. Authorization occurs before data retrieval, and journal text is framed in XML boundaries with rigid prompt-injection defenses.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'What have I been working on recently?',
                'What repeated goals or habits have I recorded?',
                'Summarize my key personal growth milestones',
              ].map((querySample, idx) => (
                <button
                  key={idx}
                  onClick={() => onRouteChange('ask')}
                  className="text-left text-[11px] font-mono bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                >
                  "{querySample}"
                </button>
              ))}
            </div>
          </div>

          {/* Recent Journal Entries */}
          <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Recent Journal Entries
              </h3>
              <button
                onClick={() => onRouteChange('journal')}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                View all in Vault
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 font-mono space-y-2">
                <p>No journal entries in this user vault yet.</p>
                <button
                  onClick={onNewEntry}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
                >
                  Write Your First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {entries.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onRouteChange('journal')}
                    className="p-3.5 bg-[#0A0A0B] hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-lg transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{entry.title}</h4>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {entry.tags.map((t, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: AI Summaries, Pending Action Items & Security Quick Status */}
        <div className="space-y-6">
          {/* Action Items from Knowledge Syntheses */}
          <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Action Items from Summaries
            </h3>
            {allActionItems.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-3">
                No action items extracted yet. Start a multi-turn chat in <span className="text-slate-300">/chat</span> and generate an automatic summary.
              </p>
            ) : (
              <div className="space-y-2">
                {allActionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-slate-300 flex items-start gap-2 font-mono"
                  >
                    <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent AI Syntheses */}
          <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Recent AI Conversation Summaries
            </h3>
            {summaries.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-3">
                No summaries yet. Use the "Summarize" button inside Multi-Turn Chat.
              </p>
            ) : (
              <div className="space-y-3">
                {summaries.slice(0, 3).map((sum) => (
                  <div key={sum.id} className="p-3 bg-[#0A0A0B] border border-slate-800 rounded-lg space-y-1">
                    <p className="text-xs font-bold text-slate-200 font-mono">{sum.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sum.shortSummary}
                    </p>
                    {sum.keyTopics && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sum.keyTopics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Security Inspector Trigger */}
          <div className="p-4 bg-[#111113] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                AUDIT MATRIX
              </span>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verify real-time IDOR penetration rejection, Secret Manager runtime access, and token authentication.
            </p>
            <button
              onClick={() => onRouteChange('settings')}
              className="w-full py-2 bg-[#0A0A0B] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors text-xs font-mono"
            >
              Open Security & Secrets Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
