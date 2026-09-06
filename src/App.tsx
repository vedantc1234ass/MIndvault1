import React, { useState, useEffect } from 'react';
import { auth, getUserJournalCollection, logoutUser } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { JournalEntry, UserProfile, PageRoute } from './types';

import { NavigationSidebar } from './components/NavigationSidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { JournalView } from './components/JournalView';
import { AskJournalView } from './components/AskJournalView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';

import { JournalEditor } from './components/JournalEditor';
import { AiReflectionModal } from './components/AiReflectionModal';
import { SecurityInspectorModal } from './components/SecurityInspectorModal';

import {
  ShieldCheck,
  Terminal,
  LogOut,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Routing state
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('login');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);
  const [isReflectionOpen, setIsReflectionOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // URL route parsing
  const getRouteFromPath = (path: string): PageRoute => {
    const clean = path.replace(/^\//, '').toLowerCase();
    if (clean === 'dashboard') return 'dashboard';
    if (clean === 'chat') return 'chat';
    if (clean === 'journal') return 'journal';
    if (clean === 'ask') return 'ask';
    if (clean === 'insights') return 'insights';
    if (clean === 'settings') return 'settings';
    return 'login';
  };

  // Sync route changes to browser history
  const navigateTo = (route: PageRoute) => {
    setCurrentRoute(route);
    const targetPath = route === 'login' ? '/login' : `/${route}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath(window.location.pathname);
      if (user) {
        setCurrentRoute(route === 'login' ? 'dashboard' : route);
      } else {
        setCurrentRoute('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      if (currentUser) {
        const profile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          isAnonymous: currentUser.isAnonymous,
        };
        setUser(profile);

        // If on login or root, transition to dashboard
        const currentPathRoute = getRouteFromPath(window.location.pathname);
        if (currentPathRoute === 'login') {
          navigateTo('dashboard');
        } else {
          setCurrentRoute(currentPathRoute);
        }
      } else {
        setUser(null);
        setEntries([]);
        setCurrentRoute('login');
        if (window.location.pathname !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch entries for authenticated user
  const fetchEntries = async () => {
    if (!user) return;
    setEntriesLoading(true);
    try {
      const colRef = getUserJournalCollection(user.uid);
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({
          id: doc.id,
          userId: d.userId,
          title: d.title || 'Untitled Entry',
          content: d.content || '',
          mood: d.mood,
          tags: d.tags || [],
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        });
      });

      setEntries(items);
    } catch (err: any) {
      console.error('[Fetch Entries Error]:', err);
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex items-center justify-center p-4 font-mono">
        <div className="text-center space-y-3 p-6 bg-[#111113] border border-slate-800 rounded-lg max-w-sm shadow-xl">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              AUTHENTICATING MINDVAULT
            </p>
            <p className="text-[11px] text-slate-500">
              Verifying cryptographic Firebase OIDC token & isolated storage...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated user is strictly gated into /login
  if (!user || currentRoute === 'login') {
    return (
      <LoginView
        onLoginSuccess={() => {
          navigateTo('dashboard');
        }}
      />
    );
  }

  // Authenticated Workspace Layout
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Persistent Navigation Sidebar */}
      <NavigationSidebar
        currentRoute={currentRoute}
        onRouteChange={(route) => navigateTo(route)}
        user={user}
        onLogout={handleLogout}
        onOpenAuditModal={() => setIsInspectorOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-[#111113] border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 uppercase">LOCATION:</span>
            <span className="text-emerald-400 font-bold uppercase">/{currentRoute}</span>
          </div>

          {/* Security Telemetry Status Chips */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RULES: ISOLATED
            </span>
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              SECRET MANAGER: ACTIVE
            </span>
            <span className="text-blue-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              GATEWAY: ZERO-EXPOSURE
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="px-2.5 py-1.5 bg-[#0A0A0B] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">AUDIT MATRIX</span>
              <span className="sm:hidden">AUDIT</span>
            </button>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1400px] mx-auto w-full">
            {currentRoute === 'dashboard' && (
              <DashboardView
                user={user}
                entries={entries}
                onRouteChange={navigateTo}
                onNewEntry={() => {
                  setEntryToEdit(null);
                  setIsEditorOpen(true);
                }}
                onOpenAuditModal={() => setIsInspectorOpen(true)}
              />
            )}

            {currentRoute === 'chat' && <ChatView user={user} />}

            {currentRoute === 'journal' && (
              <JournalView
                user={user}
                entries={entries}
                onRefreshEntries={fetchEntries}
                onOpenReflection={() => setIsReflectionOpen(true)}
                onOpenEditor={(entry) => {
                  setEntryToEdit(entry || null);
                  setIsEditorOpen(true);
                }}
              />
            )}

            {currentRoute === 'ask' && (
              <AskJournalView
                user={user}
                entries={entries}
                onOpenEditor={() => {
                  setEntryToEdit(null);
                  setIsEditorOpen(true);
                }}
              />
            )}

            {currentRoute === 'insights' && (
              <InsightsView user={user} entries={entries} />
            )}

            {currentRoute === 'settings' && (
              <SettingsView user={user} onLogout={handleLogout} />
            )}
          </div>
        </main>
      </div>

      {/* Persistent Modals */}
      <JournalEditor
        uid={user.uid}
        entryToEdit={entryToEdit}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={fetchEntries}
      />

      <AiReflectionModal
        uid={user.uid}
        entries={entries}
        isOpen={isReflectionOpen}
        onClose={() => setIsReflectionOpen(false)}
        onSavedSummary={fetchEntries}
      />

      <SecurityInspectorModal
        uid={user.uid}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
