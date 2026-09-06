import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { getUserJournalCollection, getUserJournalDoc } from '../lib/firebase';
import { addDoc, setDoc } from 'firebase/firestore';
import {
  Save,
  X,
  Lock,
  Tag,
  Smile,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface JournalEditorProps {
  uid: string;
  entryToEdit: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const MOODS = [
  { label: 'Calm', icon: '🍃', color: 'bg-[#0A0A0B] text-emerald-400 border-slate-800' },
  { label: 'Reflective', icon: '🪞', color: 'bg-[#0A0A0B] text-blue-400 border-slate-800' },
  { label: 'Energized', icon: '⚡', color: 'bg-[#0A0A0B] text-amber-400 border-slate-800' },
  { label: 'Grateful', icon: '🙏', color: 'bg-[#0A0A0B] text-purple-400 border-slate-800' },
  { label: 'Anxious', icon: '🌧️', color: 'bg-[#0A0A0B] text-slate-400 border-slate-800' },
  { label: 'Challenged', icon: '⛰️', color: 'bg-[#0A0A0B] text-orange-400 border-slate-800' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  uid,
  entryToEdit,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title || '');
      setContent(entryToEdit.content || '');
      setMood(entryToEdit.mood || 'Reflective');
      setTags(entryToEdit.tags || []);
    } else {
      setTitle('');
      setContent('');
      setMood('Reflective');
      setTags(['mindfulness']);
    }
    setError(null);
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your journal entry.');
      return;
    }
    if (!content.trim()) {
      setError('Journal content cannot be empty.');
      return;
    }
    if (title.length > 200) {
      setError('Title cannot exceed 200 characters (enforced by Firestore rules).');
      return;
    }
    if (content.length > 50000) {
      setError('Content cannot exceed 50,000 characters (enforced by Firestore rules).');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      if (entryToEdit) {
        // Update existing entry at users/{uid}/journalEntries/{id}
        const docRef = getUserJournalDoc(uid, entryToEdit.id);
        await setDoc(
          docRef,
          {
            userId: uid, // Must match auth.uid per rules
            title: title.trim(),
            content: content.trim(),
            mood,
            tags,
            updatedAt: now,
          },
          { merge: true }
        );
      } else {
        // Create new entry
        const colRef = getUserJournalCollection(uid);
        await addDoc(colRef, {
          userId: uid,
          title: title.trim(),
          content: content.trim(),
          mood,
          tags,
          createdAt: now,
          updatedAt: now,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('[Journal Save Error]:', err);
      if (err.code === 'permission-denied') {
        setError('Security Rule Violation: Firestore rejected the write. Ensure your user session is active and claims are valid.');
      } else {
        setError(err.message || 'Failed to save entry.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-[#111113] border border-slate-800 rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-300 font-mono">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0A0A0B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/40">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight uppercase">
                {entryToEdit ? 'Edit Protected Journal Entry' : 'New Encrypted Entry'}
              </h3>
              <p className="text-[10px] text-slate-500">
                Storage: users/{uid.slice(0, 8)}.../journalEntries
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

        {/* Security Indicator */}
        <div className="bg-emerald-500/5 border-b border-emerald-500/20 px-5 py-2 flex items-center gap-2 text-[11px] text-emerald-400">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Strict Data Isolation Active: Scoped exclusively to your verified UID via Firestore Rules.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 space-y-4 font-sans">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1 font-mono">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Title
              </label>
              <span className="text-[10px] text-slate-500">{title.length} / 200</span>
            </div>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Reflections on Leadership & Resilience"
              className="w-full px-3.5 py-2 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Emotional State / State Vector
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const isSelected = mood === m.label;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setMood(m.label)}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-xs'
                        : `${m.color} hover:border-slate-700`
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1 font-mono">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Private Journal Content
              </label>
              <span className="text-[10px] text-slate-500">
                {content.length.toLocaleString()} / 50,000 bytes
              </span>
            </div>
            <textarea
              required
              rows={9}
              maxLength={50000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your honest reflections here. Stored securely in Firestore users/{uid}/journalEntries and never exposed to the public."
              className="w-full px-3.5 py-2.5 bg-[#0A0A0B] border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed font-sans placeholder-slate-600"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0A0A0B] text-slate-300 text-[10px] font-mono rounded border border-slate-800"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-500" />
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g., resilience, growth) & press Enter"
                className="flex-1 px-3 py-1.5 bg-[#0A0A0B] border border-slate-800 rounded text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-[#0A0A0B] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0A0A0B] border-t border-slate-800 flex items-center justify-between font-mono">
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Encrypted at rest & in transit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Writing...' : 'Save to Vault'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

