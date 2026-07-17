'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(data.user.role === 'student' || data.user.role === 'teacher' ? '/attendance' : '/dashboard');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25 mb-6">
              <UserCheck size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">AttendFlow</h1>
            <p className="text-text-muted mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass rounded-2xl p-8 space-y-5 border border-border">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-text-dim">
              Demo credentials: admin@gmail.com / admin123
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-600/20 via-bg to-cyan-600/20 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="relative text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-float">
            <UserCheck size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-text mb-4">Streamline Your Attendance</h2>
          <p className="text-text-muted text-lg leading-relaxed">
            Track, manage, and analyze student attendance with ease. Beautiful insights, real-time updates, and seamless workflows.
          </p>
          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">98%</p>
              <p className="text-xs text-text-dim mt-1">Uptime</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">10k+</p>
              <p className="text-xs text-text-dim mt-1">Students</p>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">99%</p>
              <p className="text-xs text-text-dim mt-1">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
