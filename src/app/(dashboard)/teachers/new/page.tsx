'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

function generateCredentials(name: string) {
  const first = name.split(/\s+/)[0].toLowerCase();
  return { email: `${first}@gmail.com`, password: `${first}123` };
}

export default function NewTeacherPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  const emailTouched = useRef(false);
  const passwordTouched = useRef(false);

  const updateForm = useCallback((updates: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNameChange = (value: string) => {
    setForm(prev => {
      const next = { ...prev, name: value };
      if (value && !emailTouched.current) next.email = generateCredentials(value).email;
      if (value && !passwordTouched.current) next.password = generateCredentials(value).password;
      return next;
    });
  };

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
    setCreatedCreds(null);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create teacher'); return; }

      if (data.credentials) setCreatedCreds(data.credentials);
      toast.success('Teacher created successfully!');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (createdCreds) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="glass rounded-2xl p-8 border border-border text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold">Teacher Created!</h2>
          <p className="text-text-muted">Share these credentials with the teacher:</p>
          <div className="bg-surface rounded-xl p-4 border border-border text-left space-y-2">
            <div><span className="text-text-muted text-sm">Email:</span> <span className="font-mono text-text">{createdCreds.email}</span></div>
            <div><span className="text-text-muted text-sm">Password:</span> <span className="font-mono text-text">{createdCreds.password}</span></div>
          </div>
          <button onClick={() => router.push('/teachers')}
            className="btn-gradient px-6 py-3 rounded-xl text-white font-medium">
            Go to Teachers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-muted hover:text-text transition-colors">
        <ArrowLeft size={18} /><span>Back</span>
      </button>

      <div>
        <h1 className="text-3xl font-bold">Add New Teacher</h1>
        <p className="text-text-muted mt-1">Email &amp; password auto-generate from the name</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 border border-border space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Full Name *</label>
            <input type="text" value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter full name"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Email *</label>
            <input type="email" value={form.email}
              onChange={(e) => { emailTouched.current = true; updateForm({ email: e.target.value }); }}
              placeholder="Auto-generated from name"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all" />
            {!emailTouched.current && form.name && (
              <p className="text-xs text-green-400 mt-1">Auto-generated</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => { passwordTouched.current = true; updateForm({ password: e.target.value }); }}
                placeholder="Auto-generated from name"
                className="w-full px-4 py-3 pr-12 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!passwordTouched.current && form.name && (
              <p className="text-xs text-green-400 mt-1">Auto-generated</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Phone</label>
            <input type="tel" value={form.phone}
              onChange={(e) => updateForm({ phone: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" disabled={loading}
            className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Teacher'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-border text-text-muted hover:text-text transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
