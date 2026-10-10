'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutGrid, Crosshair, Sparkles, BookOpen, User, Database,
  Search, ChevronRight, Plus, Pencil, Trash2, Copy, Check,
  RefreshCw, Zap, Moon, Sun, X, Terminal, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------
   TYPES
-------------------------------------------------------------------------- */
type AppStatus = 'applied' | 'interviewing' | 'offer' | 'rejected';
type ViewMode = 'table' | 'kanban';
type ActiveTab = 'applications' | 'radar' | 'ai' | 'qa' | 'profile' | 'sync';

interface Application {
  _id?: string;
  company: string;
  role: string;
  status: AppStatus;
  dateApplied?: string;
  location?: string;
  url?: string;
  notes?: string;
}

interface QAItem {
  _id?: string;
  title: string;
  category: string;
  keywords?: string[];
  answer: string;
}

interface Toast {
  id: number;
  message: string;
}

/* -------------------------------------------------------------------------
   HELPERS
-------------------------------------------------------------------------- */
function monogram(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'JB';
}

const STATUS_META: Record<AppStatus, { label: string; variant: 'secondary' | 'ai' | 'success' | 'destructive' }> = {
  applied: { label: 'Applied', variant: 'secondary' },
  interviewing: { label: 'Interviewing', variant: 'ai' },
  offer: { label: 'Offer', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

const ALL_STATUSES: AppStatus[] = ['applied', 'interviewing', 'offer', 'rejected'];

/* -------------------------------------------------------------------------
   TOAST SYSTEM
-------------------------------------------------------------------------- */
function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 shadow-lg min-w-[260px] max-w-sm"
        >
          <span className="text-sm text-zinc-200 flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   SIDEBAR
-------------------------------------------------------------------------- */
const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'applications', label: 'Pipeline & Tracker', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'radar', label: 'K-Apply Hunter', icon: <Crosshair className="w-4 h-4" />, badge: 'Auto' },
  { id: 'ai', label: 'AI Pitch Studio', icon: <Sparkles className="w-4 h-4" />, badge: 'Ollama' },
  { id: 'qa', label: 'Knowledge Vault', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'profile', label: 'Candidate Profile', icon: <User className="w-4 h-4" /> },
  { id: 'sync', label: 'Cloud Sync & DB', icon: <Database className="w-4 h-4" /> },
];

function Sidebar({
  active, onNav, appCount, qaCount, profile, theme, onThemeToggle, onCommandOpen,
}: {
  active: ActiveTab;
  onNav: (t: ActiveTab) => void;
  appCount: number;
  qaCount: number;
  profile: Record<string, string>;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onCommandOpen: () => void;
}) {
  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 h-screen sticky top-0 z-[40]">
      {/* Brand */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-50">K-Apply</span>
          <Badge variant="ai" className="text-[9px] py-0 px-1.5">PRO</Badge>
        </Link>
        <button onClick={onThemeToggle} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Search / command bar */}
      <button
        onClick={onCommandOpen}
        className="mx-3 mt-3 flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Search or jump to...</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded px-1">⌘K</span>
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="mb-1">
          <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Core Workflows
          </span>
          {NAV_ITEMS.slice(0, 4).map(({ id, label, icon, badge }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
                active === id
                  ? 'bg-zinc-800 text-zinc-50 font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              {icon}
              <span className="flex-1 text-left text-[13px]">{label}</span>
              {badge && <Badge variant="secondary" className="text-[9px] py-0 px-1.5">{badge}</Badge>}
              {id === 'applications' && appCount > 0 && (
                <span className="text-[10px] text-zinc-500 font-mono">{appCount}</span>
              )}
              {id === 'qa' && qaCount > 0 && (
                <span className="text-[10px] text-zinc-500 font-mono">{qaCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 block">
            Settings & Platform
          </span>
          {NAV_ITEMS.slice(4).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
                active === id
                  ? 'bg-zinc-800 text-zinc-50 font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              {icon}
              <span className="text-[13px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User tile */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
            {profile.fullName ? profile.fullName[0].toUpperCase() : 'K'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-zinc-200 truncate">{profile.fullName || 'Your Profile'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{profile.currentRole || 'Senior Full Stack'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------
   COMMAND PALETTE
-------------------------------------------------------------------------- */
function CommandPalette({
  open, onClose, onNav, theme, onThemeToggle, onNewApp, onNewQA,
}: {
  open: boolean;
  onClose: () => void;
  onNav: (t: ActiveTab) => void;
  theme: string;
  onThemeToggle: () => void;
  onNewApp: () => void;
  onNewQA: () => void;
}) {
  const [query, setQuery] = useState('');

  const commands = useMemo(() => [
    { id: 'nav-apps', label: 'Pipeline & Tracker', group: 'Go to', action: () => { onNav('applications'); onClose(); } },
    { id: 'nav-radar', label: 'K-Apply Hunter', group: 'Go to', action: () => { onNav('radar'); onClose(); } },
    { id: 'nav-ai', label: 'AI Pitch Studio', group: 'Go to', action: () => { onNav('ai'); onClose(); } },
    { id: 'nav-qa', label: 'Knowledge Vault', group: 'Go to', action: () => { onNav('qa'); onClose(); } },
    { id: 'nav-profile', label: 'Candidate Profile', group: 'Go to', action: () => { onNav('profile'); onClose(); } },
    { id: 'new-app', label: 'Create New Application', group: 'Actions', action: () => { onNewApp(); onClose(); } },
    { id: 'new-qa', label: 'Add Q&A Template', group: 'Actions', action: () => { onNewQA(); onClose(); } },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, group: 'Appearance', action: () => { onThemeToggle(); onClose(); } },
  ], [theme]);

  const filtered = query
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const groups = [...new Set(filtered.map(c => c.group))];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[50] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {groups.map(group => (
            <div key={group}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group}</p>
              {filtered.filter(c => c.group === group).map(cmd => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 transition-colors text-left"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                  {cmd.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   APPLICATION FORM MODAL
-------------------------------------------------------------------------- */
function AppModal({
  open, onClose, onSave, editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  editing: Application | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Application' : 'Add Application'}</DialogTitle>
          <DialogDescription>Track a job application in your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSave} className="px-6 pb-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" defaultValue={editing?.company} required placeholder="e.g. Stripe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" defaultValue={editing?.role} required placeholder="e.g. Senior Full Stack" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                name="status"
                defaultValue={editing?.status || 'applied'}
                className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-300 focus:outline-none"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateApplied">Date Applied</Label>
              <Input id="dateApplied" name="dateApplied" type="date" defaultValue={editing?.dateApplied || new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={editing?.location} placeholder="Remote / San Francisco" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">Job URL</Label>
              <Input id="url" name="url" defaultValue={editing?.url} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={editing?.notes} placeholder="Any context or follow-up notes..." rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700">Cancel</Button>
            <Button type="submit" variant="accent">{editing ? 'Update' : 'Add to Pipeline'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------
   APPLICATIONS VIEW
-------------------------------------------------------------------------- */
function ApplicationsView({
  apps, onEdit, onDelete, onStatusChange,
}: {
  apps: Application[];
  onEdit: (a: Application) => void;
  onDelete: (id: string, co: string) => void;
  onStatusChange: (id: string, s: AppStatus) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const filtered = useMemo(() => {
    return apps.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (a.company?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [apps, statusFilter, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="pl-9 h-8 text-xs bg-zinc-900 border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', ...ALL_STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-zinc-700 text-zinc-50'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
            >
              {s === 'all' ? 'All' : STATUS_META[s].label}
              <span className="ml-1.5 text-zinc-500 font-mono">
                {s === 'all' ? apps.length : apps.filter(a => a.status === s).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-md border border-zinc-700 overflow-hidden ml-auto">
          {(['table', 'kanban'] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={cn(
                'px-3 py-1.5 text-xs capitalize transition-colors',
                viewMode === m ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-800'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Company</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hidden md:table-cell">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Applied</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 text-sm">
                    No applications found. Add your first application to start tracking.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/60 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0">
                          {monogram(a.company)}
                        </div>
                        <span className="font-medium text-zinc-200">{a.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-zinc-400 text-sm">{a.role}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={e => onStatusChange(a._id!, e.target.value as AppStatus)}
                        className="text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-xs">{a.location || '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-xs font-mono">{a.dateApplied || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(a)} className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(a._id!, a.company)} className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ALL_STATUSES.map(stage => {
            const stageApps = filtered.filter(a => a.status === stage);
            return (
              <div key={stage} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={STATUS_META[stage].variant} className="text-[10px]">{STATUS_META[stage].label}</Badge>
                  <span className="text-xs font-mono text-zinc-500">{stageApps.length}</span>
                </div>
                <div className="space-y-2">
                  {stageApps.map(a => (
                    <div key={a._id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-700 transition-colors group">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-medium text-zinc-200">{a.company}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(a)} className="p-0.5 text-zinc-600 hover:text-zinc-300">
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">{a.role}</p>
                      {a.dateApplied && <p className="text-[10px] text-zinc-600 mt-1 font-mono">{a.dateApplied}</p>}
                    </div>
                  ))}
                  {stageApps.length === 0 && (
                    <p className="text-[11px] text-zinc-600 text-center py-4">No applications</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   AI PITCH STUDIO VIEW
-------------------------------------------------------------------------- */
function AiPitchView({ ollamaConnected, availableModels }: { ollamaConnected: boolean; availableModels: string[] }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Full Stack Developer');
  const [jobDesc, setJobDesc] = useState('');
  const [tone, setTone] = useState('Executive & Senior Engineer');
  const [model, setModel] = useState(availableModels[0] || 'llama3.1');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, jobDescription: jobDesc, customInstructions: `Tone: ${tone}`, model }),
      });
      const data = await res.json();
      if (data.success) setResult(data.coverLetter);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid md:grid-cols-5 gap-6">
      <div className="md:col-span-2 space-y-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Cover Letter
            </CardTitle>
            <CardDescription className="text-zinc-500">Generate tailored pitch using local Ollama</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ai-company">Target Company</Label>
                <Input id="ai-company" value={company} onChange={e => setCompany(e.target.value)} required placeholder="e.g. Stripe" className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-role">Target Role</Label>
                <Input id="ai-role" value={role} onChange={e => setRole(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-desc">Job Description (optional)</Label>
                <Textarea id="ai-desc" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3} placeholder="Paste job description for tailored output..." className="bg-zinc-800 border-zinc-700 text-zinc-100 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-200 px-2">
                  {['Executive & Senior Engineer', 'Concise & Technical', 'Collaborative & Culture-fit'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Ollama Model</Label>
                <div className="flex items-center gap-2">
                  <select value={model} onChange={e => setModel(e.target.value)} className="h-8 flex-1 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-200 px-2">
                    {(availableModels.length ? availableModels : ['llama3.1']).map(m => <option key={m}>{m}</option>)}
                  </select>
                  <Badge variant={ollamaConnected ? 'success' : 'destructive'} className="text-[9px] flex-shrink-0">
                    {ollamaConnected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
              </div>
              <Button type="submit" variant="accent" className="w-full gap-2" disabled={loading}>
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? 'Generating...' : 'Generate Cover Letter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        <Card className="bg-zinc-900 border-zinc-800 h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-100 text-sm">Generated Output</CardTitle>
            {result && (
              <Button size="sm" variant="outline" onClick={handleCopy} className="border-zinc-700 text-xs gap-1.5">
                {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 rounded bg-zinc-800" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            ) : result ? (
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Sparkles className="w-8 h-8 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Fill in the form and generate your tailored cover letter</p>
                <p className="text-xs text-zinc-600 mt-1">Powered by local Ollama - zero cloud telemetry</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   HUNTER / RADAR VIEW
-------------------------------------------------------------------------- */
function HunterView({ showToast }: { showToast: (msg: string) => void }) {
  const [company, setCompany] = useState('stripe');
  const [role, setRole] = useState('Full Stack Engineer');
  const [portal, setPortal] = useState('auto');
  const [results, setResults] = useState<Array<{id:string;title:string;company:string;portal:string;apply_url:string;matchScore:number;location:string}>>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(['Hunter engine initialized & idle.']);
  const [subTab, setSubTab] = useState<'jobs'|'terminal'>('jobs');

  const addLog = (t: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${t}`, ...prev.slice(0, 49)]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog(`Scanning ATS boards for ${company} (${portal}) - role: ${role}...`);
    try {
      const res = await fetch('/api/hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hunt', company, portal, role }),
      });
      const data = await res.json();
      if (data.success && data.jobs?.length) {
        setResults(data.jobs);
        showToast(`Hunter found ${data.jobs.length} openings for ${company}`);
        addLog(`Found ${data.jobs.length} openings. Intelligence pre-computed.`);
      } else {
        setResults([]);
        addLog(`No active openings found for ${company}. Try another slug.`);
      }
    } catch {
      addLog('Hunter scan error. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1 flex-1 min-w-[140px]">
              <Label>Target Company</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. stripe" className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-xs" />
            </div>
            <div className="space-y-1 flex-1 min-w-[160px]">
              <Label>Target Role</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100 h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label>ATS Portal</Label>
              <select value={portal} onChange={e => setPortal(e.target.value)} className="h-8 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-200 px-2">
                {['auto', 'greenhouse', 'lever', 'ashby', 'workday'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <Button type="submit" variant="accent" disabled={loading} className="gap-1.5 text-xs h-8">
              <Crosshair className="w-3.5 h-3.5" />
              {loading ? 'Scanning...' : 'Run Radar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs value={subTab} onValueChange={v => setSubTab(v as 'jobs'|'terminal')}>
        <TabsList className="bg-zinc-800 border border-zinc-700 h-8">
          <TabsTrigger value="jobs" className="text-xs">Job Matches</TabsTrigger>
          <TabsTrigger value="terminal" className="gap-1.5 text-xs"><Terminal className="w-3 h-3" /> Terminal</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Crosshair className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No results yet. Run the radar to discover openings.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map(job => (
                <Card key={job.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-zinc-500">{job.company || company}</span>
                        <CardTitle className="text-zinc-100 text-sm mt-0.5">{job.title}</CardTitle>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xl font-bold text-blue-400">{job.matchScore || 85}%</span>
                        <p className="text-[10px] text-zinc-500">match</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-zinc-500 mb-3">{job.location || 'Remote'} • {job.portal?.toUpperCase()}</p>
                    <Button asChild size="sm" variant="accent" className="w-full text-xs gap-1.5">
                      <a href={job.apply_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3" /> Open & Autofill
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminal">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-400 h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed">{log}</div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------
   KNOWLEDGE VAULT VIEW (Q&A)
-------------------------------------------------------------------------- */
function QaModal({ open, onClose, onSave, editing }: {
  open: boolean; onClose: () => void; onSave: (e: React.FormEvent<HTMLFormElement>) => void; editing: QAItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Q&A' : 'Add Q&A Template'}</DialogTitle>
          <DialogDescription>Add to your knowledge vault for fast copy-paste during applications.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSave} className="px-6 pb-2 space-y-4">
          <div className="space-y-1.5">
            <Label>Title / Situation</Label>
            <Input name="title" defaultValue={editing?.title} required placeholder="e.g. Production Incident Fixed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select name="category" defaultValue={editing?.category || 'behavioral'} className="h-9 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3">
                {['behavioral', 'technical', 'leadership', 'culture', 'intro'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Keywords (comma separated)</Label>
              <Input name="keywords" defaultValue={editing?.keywords?.join(', ')} placeholder="incident, production, debug" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Answer / Response</Label>
            <Textarea name="answer" defaultValue={editing?.answer} required rows={5} placeholder="Write your full answer here..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700">Cancel</Button>
            <Button type="submit" variant="accent">{editing ? 'Update' : 'Add to Vault'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------
   SYNC VIEW
-------------------------------------------------------------------------- */
function SyncView({
  connectionStatus, onSeed,
}: {
  connectionStatus: { connected: boolean; mode?: string; message?: string };
  onSeed: (force: boolean) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" /> MongoDB Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', connectionStatus.connected ? 'bg-emerald-500' : 'bg-red-500')} />
            <span className="text-sm text-zinc-300">{connectionStatus.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {connectionStatus.mode && (
            <p className="text-xs text-zinc-500 font-mono">Mode: {connectionStatus.mode}</p>
          )}
          {connectionStatus.message && (
            <p className="text-xs text-zinc-500">{connectionStatus.message}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-sm">Database Actions</CardTitle>
          <CardDescription className="text-zinc-500">Manage your local MongoDB collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 gap-2 text-sm" onClick={() => onSeed(false)}>
            <RefreshCw className="w-3.5 h-3.5" /> Seed Missing Data
          </Button>
          <Button variant="destructive" className="w-full gap-2 text-sm" onClick={() => onSeed(true)}>
            <Trash2 className="w-3.5 h-3.5" /> Reset & Re-seed Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------
   DASHBOARD ROOT
-------------------------------------------------------------------------- */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('applications');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [cmdOpen, setCmdOpen] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState({ connected: false, mode: 'loading', message: '' });
  const [ollamaStatus, setOllamaStatus] = useState({ connected: false, currentModel: 'llama3.1', availableModels: [] as string[] });
  const [loading, setLoading] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [profile, setProfile] = useState<Record<string, string>>({});

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [editingQa, setEditingQa] = useState<QAItem | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(p => !p); }
      if (e.key === 'Escape') { setCmdOpen(false); setAppModalOpen(false); setQaModalOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Theme sync
  useEffect(() => {
    try { const saved = localStorage.getItem('k_apply_theme'); if (saved) setTheme(saved as 'light' | 'dark'); } catch { /**/ }
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('k_apply_theme', theme); } catch { /**/ }
  }, [theme]);

  // Initial fetch
  useEffect(() => {
    (async () => {
      try {
        const [hr, olr, ar, qr, pr] = await Promise.all([
          fetch('/api/health'), fetch('/api/ai/models'),
          fetch('/api/applications'), fetch('/api/qa'), fetch('/api/profile'),
        ]);
        const [hd, old, ad, qd, pd] = await Promise.all([hr.json(), olr.json(), ar.json(), qr.json(), pr.json()]);
        setConnectionStatus(hd);
        setOllamaStatus(old);
        if (ad.applications) setApplications(ad.applications);
        if (qd.qa) setQaList(qd.qa);
        if (pd.profile) setProfile(pd.profile);
      } catch {
        showToast('Could not connect to API. Running in local mode.');
        setConnectionStatus({ connected: false, mode: 'offline', message: 'API unreachable' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // App CRUD
  const handleSaveApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Application = {
      company: fd.get('company') as string,
      role: fd.get('role') as string,
      status: fd.get('status') as AppStatus,
      dateApplied: fd.get('dateApplied') as string,
      location: fd.get('location') as string,
      url: fd.get('url') as string,
      notes: fd.get('notes') as string,
    };
    try {
      if (editingApp?._id) {
        const res = await fetch(`/api/applications/${editingApp._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { setApplications(p => p.map(a => a._id === editingApp._id ? data.application : a)); showToast(`Updated ${payload.company}`); }
      } else {
        const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { setApplications(p => [data.application, ...p]); showToast(`Added ${payload.company} to pipeline`); }
      }
      setAppModalOpen(false); setEditingApp(null);
    } catch { showToast('Error saving application'); }
  };

  const handleDeleteApp = async (id: string, company: string) => {
    if (!confirm(`Delete application for ${company}?`)) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setApplications(p => p.filter(a => a._id !== id)); showToast('Application deleted'); }
    } catch { showToast('Failed to delete'); }
  };

  const handleStatusChange = async (id: string, status: AppStatus) => {
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) setApplications(p => p.map(a => a._id === id ? { ...a, status } : a));
    } catch { showToast('Failed to update status'); }
  };

  // QA CRUD
  const handleSaveQa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: QAItem = {
      title: fd.get('title') as string,
      category: fd.get('category') as string,
      keywords: (fd.get('keywords') as string).split(',').map(s => s.trim()).filter(Boolean),
      answer: fd.get('answer') as string,
    };
    try {
      if (editingQa?._id) {
        const res = await fetch(`/api/qa/${editingQa._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { setQaList(p => p.map(q => q._id === editingQa._id ? data.item : q)); showToast('Updated Q&A template'); }
      } else {
        const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) { setQaList(p => [data.item, ...p]); showToast('Added to Knowledge Vault'); }
      }
      setQaModalOpen(false); setEditingQa(null);
    } catch { showToast('Error saving Q&A'); }
  };

  const handleSeed = async (force: boolean) => {
    if (!confirm(force ? 'Reset & overwrite all data?' : 'Initialize missing data from JobUtils?')) return;
    try {
      const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force }) });
      const data = await res.json();
      if (data.success) {
        const [ar, qr, pr] = await Promise.all([fetch('/api/applications'), fetch('/api/qa'), fetch('/api/profile')]);
        const [ad, qd, pd] = await Promise.all([ar.json(), qr.json(), pr.json()]);
        if (ad.applications) setApplications(ad.applications);
        if (qd.qa) setQaList(qd.qa);
        if (pd.profile) setProfile(pd.profile);
        showToast('Database seeded from JobUtils knowledge base');
      }
    } catch { showToast('Failed to seed database'); }
  };

  // KPI calculations
  const totalApps = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const conversionRate = totalApps > 0 ? ((interviewingCount + offerCount) / totalApps * 100).toFixed(1) : '0.0';

  const KPI_CARDS = [
    { label: 'Total Applications', val: String(totalApps), delta: 'All time' },
    { label: 'Active Interviews', val: String(interviewingCount), delta: '+interviews' },
    { label: 'Offers Received', val: String(offerCount), delta: 'Pipeline' },
    { label: 'Conversion Rate', val: `${conversionRate}%`, delta: 'interview+offer / total' },
  ];

  const viewTitles: Record<ActiveTab, string> = {
    applications: 'Pipeline & Tracker',
    radar: 'K-Apply Hunter',
    ai: 'AI Pitch Studio',
    qa: 'Knowledge Vault',
    profile: 'Candidate Profile',
    sync: 'Cloud Sync & DB',
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar
        active={activeTab}
        onNav={setActiveTab}
        appCount={totalApps}
        qaCount={qaList.length}
        profile={profile}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onCommandOpen={() => setCmdOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-[30] flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-zinc-600">K-Apply</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
            <span className="text-zinc-300 font-medium">{viewTitles[activeTab]}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', connectionStatus.connected ? 'bg-emerald-500' : 'bg-red-500')} />
              <span className="text-[11px] text-zinc-500">
                {connectionStatus.connected ? 'MongoDB Connected' : connectionStatus.mode || 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full', ollamaStatus.connected ? 'bg-indigo-500' : 'bg-zinc-600')} />
              <span className="text-[11px] text-zinc-500">
                Ollama {ollamaStatus.connected ? ollamaStatus.currentModel : 'Offline'}
              </span>
            </div>

            {(activeTab === 'applications') && (
              <Button size="sm" variant="accent" onClick={() => { setEditingApp(null); setAppModalOpen(true); }} className="gap-1.5 text-xs h-7">
                <Plus className="w-3.5 h-3.5" /> Add Application
              </Button>
            )}
            {(activeTab === 'qa') && (
              <Button size="sm" variant="accent" onClick={() => { setEditingQa(null); setQaModalOpen(true); }} className="gap-1.5 text-xs h-7">
                <Plus className="w-3.5 h-3.5" /> Add Q&A
              </Button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* KPI strip - applications tab only */}
          {activeTab === 'applications' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {KPI_CARDS.map(({ label, val, delta }) => (
                <Card key={label} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight text-zinc-50">{loading ? '-' : val}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{delta}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tab views */}
          {activeTab === 'applications' && (
            <ApplicationsView
              apps={applications}
              onEdit={a => { setEditingApp(a); setAppModalOpen(true); }}
              onDelete={handleDeleteApp}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'radar' && <HunterView showToast={showToast} />}

          {activeTab === 'ai' && (
            <AiPitchView
              ollamaConnected={ollamaStatus.connected}
              availableModels={ollamaStatus.availableModels}
            />
          )}

          {activeTab === 'qa' && (
            <div>
              {qaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500 mb-2">Knowledge Vault is empty</p>
                  <Button size="sm" variant="accent" onClick={() => setQaModalOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add your first Q&A
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {qaList.map(q => (
                    <Card key={q._id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <Badge variant="secondary" className="text-[9px] mb-1.5">{q.category}</Badge>
                            <CardTitle className="text-zinc-100 text-sm leading-snug">{q.title}</CardTitle>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingQa(q); setQaModalOpen(true); }} className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700">
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">{q.answer}</p>
                        {q.keywords?.length ? (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {q.keywords.slice(0, 4).map(kw => (
                              <span key={kw} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500">{kw}</span>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-100">Candidate Master Profile</CardTitle>
                  <CardDescription className="text-zinc-500">Synced to Chrome Extension and Ollama AI context</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const updated: Record<string, string> = {};
                    fd.forEach((v, k) => { updated[k] = v as string; });
                    try {
                      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                      const data = await res.json();
                      if (data.success) { setProfile(data.profile); showToast('Profile saved & synced'); }
                    } catch { showToast('Failed to save profile'); }
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: 'fullName', label: 'Full Name', placeholder: 'Your full name' },
                        { name: 'email', label: 'Email', placeholder: 'your@email.com' },
                        { name: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
                        { name: 'currentRole', label: 'Current Role', placeholder: 'Senior Full Stack Engineer' },
                        { name: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/...' },
                        { name: 'github', label: 'GitHub URL', placeholder: 'github.com/...' },
                      ].map(f => (
                        <div key={f.name} className="space-y-1.5">
                          <Label htmlFor={f.name}>{f.label}</Label>
                          <Input id={f.name} name={f.name} defaultValue={profile[f.name]} placeholder={f.placeholder} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea id="summary" name="summary" defaultValue={profile.summary} rows={4} placeholder="Brief professional summary for AI context..." className="bg-zinc-800 border-zinc-700 text-zinc-100" />
                    </div>
                    <Button type="submit" variant="accent" className="gap-1.5">
                      <Check className="w-4 h-4" /> Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'sync' && (
            <SyncView connectionStatus={connectionStatus} onSeed={handleSeed} />
          )}
        </main>
      </div>

      {/* Modals */}
      <AppModal open={appModalOpen} onClose={() => { setAppModalOpen(false); setEditingApp(null); }} onSave={handleSaveApp} editing={editingApp} />
      <QaModal open={qaModalOpen} onClose={() => { setQaModalOpen(false); setEditingQa(null); }} onSave={handleSaveQa} editing={editingQa} />

      {/* Command Palette */}
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNav={t => { setActiveTab(t); }}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onNewApp={() => { setEditingApp(null); setAppModalOpen(true); }}
        onNewQA={() => { setEditingQa(null); setQaModalOpen(true); }}
      />

      {/* Toasts */}
      <ToastStack toasts={toasts} onRemove={id => setToasts(p => p.filter(t => t.id !== id))} />
    </div>
  );
}
