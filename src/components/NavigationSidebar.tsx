import React from 'react';
import { PageRoute, UserProfile } from '../types';
import {
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Terminal,
  KeyRound,
  Database,
  Lock,
} from 'lucide-react';

interface NavigationSidebarProps {
  currentRoute: PageRoute;
  onRouteChange: (route: PageRoute) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAuditModal?: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentRoute,
  onRouteChange,
  user,
  onLogout,
  onOpenAuditModal,
}) => {
  const navItems: Array<{
    id: PageRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isSpecial?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Multi-Turn Chat', icon: MessageSquare },
    { id: 'journal', label: 'Journal Vault', icon: BookOpen },
    {
      id: 'ask',
      label: 'Ask My Journal',
      icon: Sparkles,
      badge: 'FEATURE',
      isSpecial: true,
    },
    { id: 'insights', label: 'Insights & Stats', icon: BarChart3 },
    { id: 'settings', label: 'Security & Secrets', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight font-mono">MINDVAULT</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">SECURE AI SECOND BRAIN</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-colors cursor-pointer ${
                isActive
                  ? item.isSpecial
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? item.isSpecial
                        ? 'text-emerald-400'
                        : 'text-white'
                      : 'text-slate-500'
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Security Quick Link */}
        {onOpenAuditModal && (
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <button
              onClick={onOpenAuditModal}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 rounded transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Security Inspector Matrix</span>
            </button>
          </div>
        )}
      </div>

      {/* Security Architecture Badge */}
      <div className="p-3 m-3 bg-[#0A0A0B] border border-slate-800 rounded text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-[10px]">
            <Lock className="w-3 h-3 text-emerald-400" />
            ISOLATION
          </span>
          <span className="text-[9px] text-emerald-400 font-bold">ACTIVE</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">
          Per-user Cloud Firestore scoping with server-side Secret Manager key isolation.
        </div>
      </div>

      {/* User Footer */}
      {user && (
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-[#0E0E10]">
          <div className="overflow-hidden mr-2">
            <p className="text-xs font-mono font-medium text-slate-200 truncate">
              {user.isAnonymous ? 'Sandbox Anon User' : user.displayName || user.email?.split('@')[0] || 'Authenticated'}
            </p>
            <p className="text-[10px] font-mono text-slate-500 truncate">
              UID: {user.uid.slice(0, 8)}...
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
