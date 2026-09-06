import React, { useState } from 'react';
import { UserProfile, JournalEntry } from '../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  Sparkles,
  Download,
  ShieldCheck,
  Smile,
  Clock,
  Layers,
} from 'lucide-react';
import { getUserJournalCollection, getUserJournalDoc } from '../lib/firebase';
import { addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface JournalViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onRefreshEntries: () => void;
  onOpenReflection: () => void;
  onOpenEditor: (entryToEdit?: JournalEntry) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  user,
  entries,
  onRefreshEntries,
  onOpenReflection,
  onOpenEditor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    entries.length > 0 ? entries[0] : null
  );

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []).filter(Boolean))
  );

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag ? e.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Delete entry
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      const docRef = getUserJournalDoc(user.uid, id);
      await deleteDoc(docRef);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
      onRefreshEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
      alert('Error deleting entry. Check Firestore permissions.');
    }
  };

  // Seed sample starter entries
  const handleSeedStarterEntries = async () => {
    try {
      const colRef = getUserJournalCollection(user.uid);
      const starters = [
        {
          userId: user.uid,
          title: 'Building Secure Personal AI Second Brains',
          content:
            'Today I started designing the MindVault architecture. It is critical that AI systems respect user privacy by default. We implemented Cloud Firestore per-user data isolation and server-side secret management. Feeling confident about the direction.',
          mood: 'Focused',
          tags: ['architecture', 'security', 'ai'],
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          userId: user.uid,
          title: 'Breakthrough on Prompt Demarcation',
          content:
            'Explored how to safely query user journal archives without exposing the model to prompt injection attacks. Wrapping untrusted text in strict XML tags and instructing Gemini to treat it purely as inert diary data works remarkably well.',
          mood: 'Inspired',
          tags: ['prompt-injection', 'defense', 'growth'],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          userId: user.uid,
          title: 'Reflection on Habits & Long-Term Goals',
          content:
            'Key goals for this quarter: 1. Deepen understanding of Zero-Trust cloud security. 2. Journal daily for mental resilience. 3. Build thoughtful software that empowers people without extracting their private data.',
          mood: 'Reflective',
          tags: ['goals', 'mindfulness', 'habits'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      for (const item of starters) {
        await addDoc(colRef, item);
      }
      onRefreshEntries();
    } catch (e) {
      console.warn('Seed error:', e);
    }
  };

  // Export entries as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mindvault_journal_${user.uid.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-[#111113] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-tight">
              Personal Journal Vault
            </h2>
            <p className="text-xs text-slate-400">
              CRUD entries stored in <code className="text-slate-300">users/{'{uid}'}/journalEntries</code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {entries.length === 0 && (
            <button
              onClick={handleSeedStarterEntries}
              className="px-3 py-1.5 bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Seed Demo Entries
            </button>
          )}

          <button
            onClick={onOpenReflection}
            disabled={entries.length === 0}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Reflection
          </button>

          <button
            onClick={handleExportJson}
            disabled={entries.length === 0}
            className="px-3 py-1.5 bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={() => onOpenEditor()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: List on Left, Active Reader on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[500px]">
        {/* Left Column: Search, Tag Filters & Entry Cards */}
        <div className="lg:col-span-5 bg-[#111113] border border-slate-800 rounded-xl p-3.5 flex flex-col overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="space-y-2 pb-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Tag Filter Chips */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                    selectedTag === null
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#0A0A0B] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  All ({entries.length})
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                      selectedTag === tag
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#0A0A0B] text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entries Feed */}
          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-xs font-mono text-slate-500 space-y-2">
                <p>No journal entries found matching criteria.</p>
                {entries.length === 0 && (
                  <button
                    onClick={() => onOpenEditor()}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Write your first entry now
                  </button>
                )}
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer font-mono space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-[#0A0A0B] hover:bg-slate-900 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold leading-snug truncate">{entry.title}</h3>
                      {entry.mood && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                          {entry.mood}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditor(entry);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Entry Full Reader View */}
        <div className="lg:col-span-7 bg-[#111113] border border-slate-800 rounded-xl p-5 flex flex-col overflow-y-auto">
          {selectedEntry ? (
            <div className="space-y-4 font-mono">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ENCRYPTED AT REST
                    </span>
                    {selectedEntry.mood && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Mood: {selectedEntry.mood}
                      </span>
                    )}
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {selectedEntry.title}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Created: {new Date(selectedEntry.createdAt).toLocaleString()} | Doc ID:{' '}
                    {selectedEntry.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenEditor(selectedEntry)}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedEntry.id, e)}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0B] hover:bg-rose-950/40 border border-slate-700 hover:border-rose-700 text-rose-400 rounded transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Tags list */}
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntry.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#0A0A0B] border border-slate-800 text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Entry Body */}
              <div className="p-4 bg-[#0A0A0B] border border-slate-800 rounded-lg text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEntry.content}
              </div>

              {/* Security Isolation Footer */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between text-[10px] text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Owner UID Isolation Enforced: Only user {user.uid.slice(0, 8)}... can read or mutate this document.
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs font-mono text-slate-500 p-6 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mb-1" />
              <p>Select an entry on the left to read, or create a new journal entry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
