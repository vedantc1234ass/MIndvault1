import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { getUserJournalDoc } from '../lib/firebase';
import { deleteDoc } from 'firebase/firestore';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Sparkles,
  MessageSquare,
  Calendar,
  Tag,
  Trash2,
  Edit3,
  Lock,
  Smile,
  ShieldCheck,
} from 'lucide-react';

interface JournalListProps {
  uid: string;
  entries: JournalEntry[];
  loading: boolean;
  onNewEntry: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onTriggerReflection: () => void;
  onTriggerChat: () => void;
  onRefresh: () => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  uid,
  entries,
  loading,
  onNewEntry,
  onEditEntry,
  onTriggerReflection,
  onTriggerChat,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const moods = Array.from(new Set(entries.map((e) => e.mood).filter(Boolean)));

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMood = selectedMood ? entry.mood === selectedMood : true;
    return matchesSearch && matchesMood;
  });

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this private journal entry?')) {
      return;
    }

    setDeletingId(entryId);
    try {
      const docRef = getUserJournalDoc(uid, entryId);
      await deleteDoc(docRef);
      onRefresh();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete entry: ' + (err.message || 'Permission denied'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111113] p-4 rounded-lg border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Vault Entries Explorer
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Path: <span className="text-slate-400">users/{uid.slice(0, 8)}.../journalEntries</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onTriggerChat}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-[#0A0A0B] hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            AI Companion
          </button>
          <button
            onClick={onTriggerReflection}
            disabled={entries.length === 0}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/60 text-xs font-mono uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Synthesize
          </button>
          <button
            onClick={onNewEntry}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider rounded font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Entry
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries, keywords, tags..."
            className="w-full pl-9 pr-4 py-2 bg-[#0A0A0B] border border-slate-800 rounded text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {moods.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mr-1">
              Mood:
            </span>
            <button
              onClick={() => setSelectedMood(null)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                selectedMood === null
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-medium'
                  : 'bg-[#0A0A0B] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              ALL
            </button>
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMood(selectedMood === m ? null : (m as string))}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  selectedMood === m
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-medium'
                    : 'bg-[#0A0A0B] text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {m?.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List / Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-slate-500 bg-[#111113] rounded-lg border border-slate-800">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Verifying security rules and loading isolated entries...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-10 text-center bg-[#111113] rounded-lg border border-slate-800 space-y-3">
          <div className="w-10 h-10 bg-[#0A0A0B] border border-slate-800 text-slate-500 rounded flex items-center justify-center mx-auto">
            <BookOpen className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              {searchTerm || selectedMood ? 'No matching entries found' : 'Secure Vault is Empty'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || selectedMood
                ? 'Try adjusting your search query or clear the mood filter.'
                : 'Write your first journal entry. Your reflections are stored securely in Firestore and isolated to your user identity.'}
            </p>
          </div>
          {!searchTerm && !selectedMood && (
            <button
              onClick={onNewEntry}
              className="mt-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider rounded transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onEditEntry(entry)}
              className="p-4 bg-[#111113] hover:bg-[#161619] border border-slate-800 hover:border-slate-700 rounded-lg transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {entry.mood && (
                      <span className="px-2 py-0.5 bg-[#0A0A0B] border border-slate-800 text-emerald-400 text-[10px] font-mono rounded">
                        ● {entry.mood.toUpperCase()}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {new Date(entry.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntry(entry);
                      }}
                      title="Edit Entry"
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      title="Delete Entry"
                      disabled={deletingId === entry.id}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-white group-hover:text-emerald-300 line-clamp-1 mb-1 font-mono">
                  {entry.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {entry.content}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex flex-wrap gap-1">
                  {entry.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-slate-400 font-mono text-[9px] bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                  {(entry.tags?.length || 0) > 3 && (
                    <span className="text-slate-500 text-[9px]">
                      +{entry.tags!.length - 3}
                    </span>
                  )}
                </div>
                <span>{entry.content.length.toLocaleString()} BYTES</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
