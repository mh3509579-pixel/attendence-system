'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Plus, CalendarDays, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface Session {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isActive: false });

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (res.ok) setSessions(data.sessions);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await fetchSessions();
      if (ignore) return;
    };
    load();
    return () => { ignore = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('All fields are required'); return;
    }
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Session created!');
      setShowForm(false);
      setForm({ name: '', startDate: '', endDate: '', isActive: false });
      fetchSessions();
    } catch { toast.error('Failed to create'); }
  };

  const toggleActive = async (session: Session) => {
    const res = await fetch(`/api/sessions/${session._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !session.isActive }),
    });
    if (res.ok) { toast.success('Session updated'); fetchSessions(); }
    else toast.error('Failed to update');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); fetchSessions(); }
    else toast.error('Failed to delete');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Sessions</h1>
          <p className="text-text-muted mt-1">Manage academic years and terms</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white">
          <Plus size={18} /> Add Session
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-2xl p-6 border border-border space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Session Name *</label>
              <input type="text" placeholder="Enter session name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Start Date *</label>
              <input type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">End Date *</label>
              <input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 w-full px-4 py-2.5 bg-surface border border-border rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-violet-500 focus:ring-violet-500" />
                <span className="text-sm text-text-muted">Set as Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-gradient px-6 py-2.5 rounded-xl text-white text-sm font-medium">Create Session</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-border text-text-muted text-sm">Cancel</button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No sessions" description="Create your first academic session."
          action={{ label: 'Add Session', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div key={session._id} className={`glass rounded-2xl p-5 border transition-all ${
              session.isActive ? 'border-violet-500/30 bg-violet-500/5' : 'border-border hover:border-violet-500/20'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    session.isActive ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-surface-light'
                  }`}>
                    <CalendarDays size={22} className={session.isActive ? 'text-white' : 'text-text-dim'} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{session.name}</h3>
                    <p className="text-xs text-text-dim">
                      {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(session)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      session.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface-light text-text-dim hover:text-text'
                    }`}
                    title={session.isActive ? 'Deactivate' : 'Activate'}>
                    {session.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </button>
                  <button onClick={() => handleDelete(session._id)}
                    className="p-1.5 rounded-lg bg-surface-light text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {session.isActive && (
                <div className="inline-flex px-3 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium">
                  Active Session
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
