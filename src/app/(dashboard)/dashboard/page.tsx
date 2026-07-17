'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatsCard from '@/components/StatsCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Users, GraduationCap, ClipboardCheck, UserCheck, TrendingUp,
  CalendarDays, Clock, AlertTriangle,
} from 'lucide-react';

interface ClassAttendance {
  class: { _id: string; name: string; section: string };
  present: { _id: string; name: string; email: string }[];
  absent: { _id: string; name: string; email: string }[];
  late: { _id: string; name: string; email: string }[];
}

interface ClassStudentCount {
  name: string;
  section: string;
  count: number;
  students: { _id: string; name: string; email: string }[];
}

interface DashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    totalToday: number;
    overallPercentage: number;
    weeklyTrend: number;
    activeSession: string | null;
  };
  classAttendance: ClassAttendance[];
  classStudentCounts: ClassStudentCount[];
  recentActivity: Array<{
    _id: string;
    student: { name: string };
    status: string;
    date: string;
    class: { name: string; section: string };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/login'); return; }
      const meData = await res.json();
      if (meData.user?.role === 'student' || meData.user?.role === 'teacher') { router.replace('/attendance'); return; }

      const dashboardRes = await fetch('/api/dashboard');
      if (dashboardRes.ok) {
        const json = await dashboardRes.json();
        setData(json);
      }
      setLoading(false);
    };
    fetchData();

    const onFocus = () => { fetchData(); };
    const onVisible = () => { if (!document.hidden) fetchData(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(fetchData, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [router]);

  if (loading) return <LoadingSpinner size="lg" />;

  const s = data?.stats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-text-muted mt-1">
            {s?.activeSession
              ? `Active Session: ${s.activeSession}`
              : 'No active session'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-border">
          <CalendarDays size={16} className="text-violet-400" />
          <span className="text-sm text-text-muted">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Students"
          value={s?.totalStudents ?? 0}
          icon={Users}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          trend={5}
          tooltip={data?.classStudentCounts && data.classStudentCounts.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-text-muted mb-2">Students per Class</p>
              <div className="space-y-1.5">
                {data.classStudentCounts.map((csc) => (
                  <div key={csc.name + csc.section} className="flex items-center justify-between text-xs">
                    <span className="text-text">{csc.name} - {csc.section}</span>
                    <span className="text-text-muted font-medium">{csc.count} students</span>
                  </div>
                ))}
              </div>
            </div>
          ) : undefined}
        />
        <StatsCard
          title="Total Teachers"
          value={s?.totalTeachers ?? 0}
          icon={GraduationCap}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
        />
        <StatsCard
          title="Total Classes"
          value={s?.totalClasses ?? 0}
          icon={ClipboardCheck}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
        <StatsCard
          title="Attendance Rate"
          value={s ? `${s.overallPercentage}%` : '0%'}
          icon={TrendingUp}
          color="text-violet-400"
          bgColor="bg-violet-500/10"
          trend={s?.weeklyTrend}
        />
      </div>

      {data?.classAttendance && data.classAttendance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.classAttendance.map((ca) => (
            <div key={ca.class._id} className="glass rounded-2xl p-5 border border-border hover:border-violet-500/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="font-semibold">{ca.class.name}</p>
                  <p className="text-xs text-text-dim">Section {ca.class.section}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="relative group">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <p className="text-lg font-bold text-emerald-400">{ca.present.length}</p>
                    <p className="text-xs text-text-muted">Present</p>
                  </div>
                  {ca.present.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-surface border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      <p className="text-xs font-medium text-emerald-400 mb-1.5">Present Students</p>
                      <div className="space-y-1">
                        {ca.present.map((st) => <p key={st._id} className="text-xs text-text">{st.name}</p>)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <p className="text-lg font-bold text-red-400">{ca.absent.length}</p>
                    <p className="text-xs text-text-muted">Absent</p>
                  </div>
                  {ca.absent.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-surface border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      <p className="text-xs font-medium text-red-400 mb-1.5">Absent Students</p>
                      <div className="space-y-1">
                        {ca.absent.map((st) => <p key={st._id} className="text-xs text-text">{st.name}</p>)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <p className="text-lg font-bold text-amber-400">{ca.late.length}</p>
                    <p className="text-xs text-text-muted">Late</p>
                  </div>
                  {ca.late.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-surface border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      <p className="text-xs font-medium text-amber-400 mb-1.5">Late Students</p>
                      <div className="space-y-1">
                        {ca.late.map((st) => <p key={st._id} className="text-xs text-text">{st.name}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Mark Attendance', icon: ClipboardCheck, href: '/attendance', color: 'from-violet-500 to-purple-600' },
            { label: 'Add Student', icon: Users, href: '/students/new', color: 'from-emerald-500 to-teal-600' },
            { label: 'View Reports', icon: TrendingUp, href: '/reports', color: 'from-amber-500 to-orange-600' },
            { label: 'Manage Classes', icon: GraduationCap, href: '/classes', color: 'from-cyan-500 to-blue-600' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="glass p-4 rounded-xl text-center hover:border-violet-500/20 transition-all group"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} mb-2 transition-transform group-hover:scale-110`}>
                <action.icon size={20} className="text-white" />
              </div>
              <p className="text-sm font-medium">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border/50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'present' ? 'bg-emerald-400' :
                  activity.status === 'absent' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.student?.name}</span>
                    {' '}was{' '}
                    <span className={`font-medium ${
                      activity.status === 'present' ? 'text-emerald-400' :
                      activity.status === 'absent' ? 'text-red-400' : 'text-amber-400'
                    }`}>{activity.status}</span>
                  </p>
                  <p className="text-xs text-text-dim">
                    {activity.class?.name} {activity.class?.section} &middot; {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
