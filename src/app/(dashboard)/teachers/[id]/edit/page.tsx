'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditTeacherPage() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/teachers/${params.id}`).then(r => r.json()).then(data => {
      if (data.teacher) {
        setForm({
          name: data.teacher.name,
          email: data.teacher.email,
          phone: data.teacher.phone || '',
          isActive: data.teacher.isActive,
        });
      }
      setLoading(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Teacher updated!');
      router.push('/teachers');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-2 border-border border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors">
        <ArrowLeft size={18} /><span>Back</span>
      </button>
      <div>
        <h1 className="text-3xl font-bold">Edit Teacher</h1>
        <p className="text-text-muted mt-1">Update teacher information</p>
      </div>
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-border space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Phone</label>
            <input type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Status</label>
            <label className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-surface text-violet-500 focus:ring-violet-500" />
              <span className="text-sm text-text-muted">Active</span>
            </label>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={saving}
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50">
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-border text-text-muted hover:text-text transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
