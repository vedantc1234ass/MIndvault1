import React, { useEffect, useState } from 'react';
import { UserProfile, JournalEntry, ConversationSummary } from '../types';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Tag,
  ShieldCheck,
  Smile,
  Activity,
} from 'lucide-react';
import { getUserSummariesCollection, getUserConversationsCollection } from '../lib/firebase';
import { getDocs, query, orderBy } from 'firebase/firestore';

interface InsightsViewProps {
  user: UserProfile;
  entries: JournalEntry[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ user, entries }) => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Summaries
        const sumCol = getUserSummariesCollection(user.uid);
        const sumSnap = await getDocs(query(sumCol, orderBy('createdAt', 'desc')));
        const sumItems: ConversationSummary[] = [];
        sumSnap.forEach((doc) => sumItems.push({ id: doc.id, ...(doc.data() as any) }));
        setSummaries(sumItems);

        // Conversations count
        const convCol = getUserConversationsCollection(user.uid);
        const convSnap = await getDocs(convCol);
        setConversationCount(convSnap.size);
      } catch (e) {
        console.warn('Analytics fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user.uid]);

  // Total words written in journal
  const totalWords = entries.reduce(
    (acc, cur) => acc + (cur.content ? cur.content.trim().split(/\s+/).length : 0),
    0
  );

  // Tag frequency breakdown
  const tagCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  // Mood frequency breakdown
  const moodCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });

  // Key topics across all summaries
  const topicCounts: Record<string, number> = {};
  summaries.forEach((s) => {
    s.keyTopics?.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const allActionItems = summaries.flatMap((s) => s.actionItems || []);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">
              Personal Knowledge & Growth Insights
            </h2>
            <p className="text-xs text-slate-400">
              Computed strictly from isolated records belonging to <code className="text-slate-300">users/{user.uid.slice(0, 8)}...</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% PRIVATE METRICS
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>TOTAL WORDS WRITTEN</span>
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-light text-white">{totalWords.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-1">Across {entries.length} journal reflections</p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>ACTIVE CHAT SESSIONS</span>
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-light text-white">{conversationCount}</div>
          <p className="text-[10px] text-slate-500 mt-1">Multi-turn Gemini interactions</p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>SUMMARIES SYNTHESIZED</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-light text-white">{summaries.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Structured knowledge records</p>
        </div>

        <div className="p-4 bg-[#111113] border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>ACTION ITEMS LOGGED</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-light text-white">{allActionItems.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Derived from AI syntheses</p>
        </div>
      </div>

      {/* 2-Column Analytics Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Discussed Knowledge Topics */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Most Frequent Knowledge Topics
            </h3>
            <span className="text-[10px] text-slate-500">From Summaries</span>
          </div>

          {topTopics.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No conversation summaries yet. Synthesize conversations in /chat to see topics here.
            </p>
          ) : (
            <div className="space-y-3">
              {topTopics.map(([topic, count], idx) => {
                const maxCount = Math.max(...topTopics.map((t) => t[1]));
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{topic}</span>
                      <span className="text-slate-500">{count} occurrences</span>
                    </div>
                    <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Journal Tag Distribution */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              Journal Tag Taxonomy
            </h3>
            <span className="text-[10px] text-slate-500">From Vault Entries</span>
          </div>

          {topTags.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No tags recorded yet. Add tags when writing journal entries.
            </p>
          ) : (
            <div className="space-y-3">
              {topTags.map(([tag, count], idx) => {
                const maxCount = Math.max(...topTags.map((t) => t[1]));
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>#{tag}</span>
                      <span className="text-slate-500">{count} entries</span>
                    </div>
                    <div className="w-full bg-[#0A0A0B] h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mood Distribution */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-400" />
              Emotional Resonance Breakdown
            </h3>
            <span className="text-[10px] text-slate-500">Self-Reported</span>
          </div>

          {Object.keys(moodCounts).length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No mood data recorded yet. Select moods when journaling.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(moodCounts).map(([mood, count], idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0A0A0B] border border-slate-800 rounded-lg text-center space-y-1"
                >
                  <p className="text-xs font-bold text-slate-200">{mood}</p>
                  <p className="text-lg font-light text-emerald-400">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consolidated Action Items */}
        <div className="bg-[#111113] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Consolidated Action Plan
            </h3>
            <span className="text-[10px] text-slate-500">From AI Syntheses</span>
          </div>

          {allActionItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No action items captured yet. Start a chat in /chat and synthesize to create tasks.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allActionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-slate-300 flex items-start gap-2"
                >
                  <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
