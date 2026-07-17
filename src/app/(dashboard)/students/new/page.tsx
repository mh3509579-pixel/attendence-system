'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

interface ClassOption {
  _id: string;
  name: string;
  section: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', classId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch('/api/classes').then(r => r.json()).then(d => { if (d.classes) setClasses(d.classes); }) }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create student');
        return;
      }

      toast.success('Student created successfully!');
      router.push('/students');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div>
        <h1 className="text-3xl font-bold">Add New Student</h1>
        <p className="text-text-muted mt-1">Create a new student account</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-border space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password (min 6 chars)"
                className="w-full px-4 py-3 pr-12 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Assign to Class</label>
            <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow">
              <option value="" className="text-text-dim">Select class (optional)</option>
              {classes.map((c) => <option key={c._id} value={c._id} className="text-text">{c.name} - {c.section}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Student'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-border text-text-muted hover:text-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
