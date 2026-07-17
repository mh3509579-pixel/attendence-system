'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Plus, GraduationCap, Users, BookOpen, Trash2 } from 'lucide-react';

interface ClassData {
  _id: string;
  name: string;
  section: string;
  subject?: string;
  teacher: { _id: string; name: string; email: string };
  session: { _id: string; name: string };
  students: string[];
  room?: string;
  schedule?: string;
}

interface Teacher {
  _id: string;
  name: string;
}

interface Session {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', section: '', subject: '', teacher: '', session: '', room: '', schedule: '' });

  const fetchData = async () => {
    try {
      const [classesRes, teachersRes, sessionsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/users?role=teacher'),
        fetch('/api/sessions'),
      ]);
      if (classesRes.ok) setClasses((await classesRes.json()).classes);
      if (teachersRes.ok) setTeachers((await teachersRes.json()).users);
      if (sessionsRes.ok) setSessions((await sessionsRes.json()).sessions);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData();
    const onVisible = () => { if (!document.hidden) fetchData(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(fetchData, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.section || !form.teacher || !form.session) {
      toast.error('Name, section, teacher, and session are required');
      return;
    }
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Class created!');
      setShowForm(false);
      setForm({ name: '', section: '', subject: '', teacher: '', session: '', room: '', schedule: '' });
      fetchData();
    } catch {
      toast.error('Failed to create class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Class deleted'); fetchData(); }
    else toast.error('Failed to delete');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-text-muted mt-1">Manage classes and sections</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass rounded-2xl p-6 border border-border space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Class Name *</label>
              <input type="text" placeholder="Enter class name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Section *</label>
              <input type="text" placeholder="Enter section" value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Subject</label>
              <input type="text" placeholder="Enter subject" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Teacher *</label>
              <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow">
                <option value="" className="text-text-dim">Select Teacher *</option>
                {teachers.map((t) => <option key={t._id} value={t._id} className="text-text">{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Session *</label>
              <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow">
                <option value="" className="text-text-dim">Select Session *</option>
                {sessions.map((s) => <option key={s._id} value={s._id} className="text-text">{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Room</label>
              <input type="text" placeholder="Enter room number" value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Schedule</label>
              <input type="text" placeholder="e.g. Mon-Wed-Fri 9:00 AM" value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-gradient px-6 py-2.5 rounded-xl text-white text-sm font-medium">Create Class</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-border text-text-muted text-sm">Cancel</button>
          </div>
        </form>
      )}

      {classes.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No classes yet" description="Create your first class to get started."
          action={{ label: 'Add Class', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c._id} className="glass rounded-2xl p-5 border border-border hover:border-violet-500/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.name} - {c.section}</h3>
                    {c.subject && <p className="text-xs text-text-dim">{c.subject}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-dim hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2"><BookOpen size={14} className="text-text-dim" /><span>{c.teacher?.name || 'No teacher'}</span></div>
                <div className="flex items-center gap-2"><Users size={14} className="text-text-dim" /><span>{c.students?.length || 0} students</span></div>
                {c.room && <div className="flex items-center gap-2"><span className="text-text-dim">Room:</span><span>{c.room}</span></div>}
                {c.session && <div className="flex items-center gap-2"><span className="text-text-dim">Session:</span><span>{c.session.name}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
