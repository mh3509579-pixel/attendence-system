'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, MoreHorizontal } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async (query?: string) => {
    try {
      const res = await fetch(`/api/students${query ? `?search=${query}` : ''}`);
      const data = await res.json();
      if (res.ok) setStudents(data.students);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await fetchStudents();
      if (ignore) return;
    };
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"?`)) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Student deleted');
      fetchStudents(search);
    } else {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-text-muted mt-1">Manage all registered students</p>
        </div>
        <button
          onClick={() => router.push('/students/new')}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text placeholder:text-text-dim focus:outline-none input-glow transition-all"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Get started by adding your first student to the system."
          action={{ label: 'Add Student', onClick: () => router.push('/students/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student._id}
              className="glass rounded-2xl p-5 border border-border hover:border-violet-500/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-xs text-text-dim">{student.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div className="relative group">
                  <button className="p-1.5 rounded-lg hover:bg-surface-light/50 transition-colors">
                    <MoreHorizontal size={16} className="text-text-dim" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-32 glass rounded-xl border border-border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => router.push(`/students/${student._id}/edit`)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-light/50"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id, student.name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-text-dim" />
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-text-dim" />
                    <span>{student.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
