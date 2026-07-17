'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  BarChart3, CalendarDays, LogOut, Menu, X, ChevronRight, UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-violet-400' },
  { href: '/students', label: 'Students', icon: Users, color: 'text-emerald-400' },
  { href: '/teachers', label: 'Teachers', icon: GraduationCap, color: 'text-cyan-400' },
  { href: '/classes', label: 'Classes', icon: BookOpen, color: 'text-blue-400' },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck, color: 'text-amber-400' },
  { href: '/reports', label: 'Reports', icon: BarChart3, color: 'text-rose-400' },
  { href: '/sessions', label: 'Sessions', icon: CalendarDays, color: 'text-indigo-400' },
];

interface ClassOption { _id: string; name: string; section: string }
interface ClassStats { className: string; totalStudents: number; present: number; absent: number; late: number; rate: number }

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isReports = pathname === '/reports' || pathname.startsWith('/reports/');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [stats, setStats] = useState<ClassStats | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUserRole(d.user.role);
    }).catch(() => {});
  }, []);

  const isStudent = userRole === 'student';

  useEffect(() => {
    if (!isReports) { setStats(null); setSelectedClass(''); return }
    fetch('/api/classes').then(r => r.json()).then(d => { if (d.classes) setClasses(d.classes) })
  }, [isReports])

  useEffect(() => {
    if (!selectedClass) { setStats(null); return }
    fetch(`/api/attendance/report?class=${selectedClass}`).then(r => r.json()).then(d => {
      if (d.report && d.report.length > 0) {
        const r = d.report
        let present = 0, absent = 0, late = 0
        r.forEach((e: Record<string, unknown>) => {
          const records = e.records as Array<{ status: string; count: number }> || []
          records.forEach((rec: { status: string; count: number }) => {
            if (rec.status === 'present') present += rec.count
            else if (rec.status === 'absent') absent += rec.count
            else if (rec.status === 'late') late += rec.count
          })
        })
        const total = present + absent + late
        const cls = classes.find(c => c._id === selectedClass)
        setStats({ className: cls ? `${cls.name} - ${cls.section}` : '', totalStudents: r.length, present, absent, late, rate: total > 0 ? Math.round(present / total * 100) : 0 })
      } else {
        const cls = classes.find(c => c._id === selectedClass)
        setStats({ className: cls ? `${cls.name} - ${cls.section}` : '', totalStudents: 0, present: 0, absent: 0, late: 0, rate: 0 })
      }
    })
  }, [selectedClass, classes])

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    window.location.href = '/login';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl glass lg:hidden hover:border-violet-500/50 transition-all"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-border transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <UserCheck size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">AttendFlow</h1>
                <p className="text-xs text-text-muted">Attendance System</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {(isStudent
              ? navItems.filter(i => i.href === '/attendance')
              : userRole === 'teacher'
                ? navItems.filter(i => i.href === '/attendance' || i.href === '/reports')
                : navItems
            ).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                      : 'text-text-muted hover:text-text hover:bg-surface-light/50 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={`${isActive ? item.color : 'text-text-dim group-hover:text-text-muted'} transition-colors`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-violet-400" />}
                </Link>
              );
            })}

            {isReports && (
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                <p className="text-xs font-medium text-text-muted px-1">Class Statistics</p>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-text text-xs focus:outline-none input-glow">
                  <option value="" className="text-text-dim">Select class</option>
                  {classes.map((c) => <option key={c._id} value={c._id} className="text-text">{c.name} - {c.section}</option>)}
                </select>
                {stats && (
                  <div className="space-y-2 px-1">
                    <p className="text-xs font-medium text-text">{stats.className}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                        <p className="text-emerald-400 font-bold">{stats.present}</p>
                        <p className="text-text-dim">Present</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10 text-center">
                        <p className="text-red-400 font-bold">{stats.absent}</p>
                        <p className="text-text-dim">Absent</p>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-center">
                        <p className="text-amber-400 font-bold">{stats.late}</p>
                        <p className="text-text-dim">Late</p>
                      </div>
                      <div className="p-2 rounded-lg bg-violet-500/10 text-center">
                        <p className="text-violet-400 font-bold">{stats.rate}%</p>
                        <p className="text-text-dim">Rate</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-dim">{stats.totalStudents} students</p>
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <div className="px-4 py-2 rounded-xl bg-surface/50 border border-border">
              <p className="text-xs text-text-dim">Signed in as</p>
              <p className="text-sm font-medium text-text capitalize">{userRole || '...'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
