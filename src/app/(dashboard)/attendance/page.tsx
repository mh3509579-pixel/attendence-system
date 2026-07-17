'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { ClipboardCheck, Check, X, Clock, Save, CalendarDays, TrendingUp, CalendarCheck, AlertTriangle, type LucideIcon } from 'lucide-react';

interface ClassData {
  _id: string;
  name: string;
  section: string;
  teacher?: { _id: string; name: string; email: string };
  students: { _id: string; name: string }[];
}

interface AttendanceRecord {
  student: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

const statusColors: Record<string, string> = {
  present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  absent: 'bg-red-500/20 text-red-400 border-red-500/30',
  late: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  excused: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const statusIcons: Record<string, LucideIcon> = {
  present: Check,
  absent: X,
  late: Clock,
  excused: Clock,
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const isStudent = userRole === 'student';

  interface StudentHistoryRecord {
    _id: string;
    date: string;
    status: string;
    class?: { _id: string; name: string; section: string };
  }

  const [studentHistory, setStudentHistory] = useState<StudentHistoryRecord[]>([]);
  const [studentStats, setStudentStats] = useState<{ present: number; absent: number; late: number; excused: number; total: number } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      let role: string | null = null;
      let id: string | null = null;
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          role = meData.user?.role;
          id = meData.user?._id;
          setUserRole(role);
          setUserId(id);
          setUserName(meData.user?.name);
        }
      } catch {}
      const classesRes = await fetch('/api/classes');
      const classesData = await classesRes.json();
      if (classesData.classes) {
        setClasses(classesData.classes);
        if (role === 'student' && id) {
          const studentClass = classesData.classes.find((c: ClassData & { students?: string[] }) =>
            Array.isArray(c.students) && c.students.includes(id)
          );
          if (studentClass) setSelectedClass(studentClass._id);
        }
      }
      setLoading(false);
    };
    loadInitial();
    const onFocus = () => fetch('/api/classes').then(r => r.json()).then(d => {
      if (d.classes) setClasses(d.classes);
    });
    const onVisible = () => { if (!document.hidden) onFocus(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const [classDetail, setClassDetail] = useState<ClassData | null>(null);

  useEffect(() => {
    if (!selectedClass) return;
    const loadStudents = async () => {
      setInitialLoading(true);
      const res = await fetch(`/api/classes/${selectedClass}`);
      const data = await res.json();
      if (data.class) {
        setClassDetail({ _id: data.class._id, name: data.class.name, section: data.class.section, teacher: data.class.teacher, students: data.class.students || [] });
        const existingRes = await fetch(`/api/attendance?class=${selectedClass}&date=${date}`);
        const existingData = await existingRes.json();

        const existingMap: Record<string, string> = {};
        existingData.records?.forEach((r: { _id: string; student?: { _id: string } | string; status: string }) => {
          const key = typeof r.student === 'string' ? r.student : r.student?._id;
          if (key) existingMap[key] = r.status;
        });

        const newRecords = (data.class.students || []).map((s: { _id: string; name: string }) => ({
          student: s._id,
          status: (existingMap[s._id] || 'present') as 'present' | 'absent' | 'late' | 'excused',
        }));
        setRecords(newRecords);
      }
      setInitialLoading(false);
    };
    loadStudents();
  }, [selectedClass, date]);

  useEffect(() => {
    if (!selectedClass || !userId) return;
    const loadStudentHistory = async () => {
      setHistoryLoading(true);
      try {
        const [reportRes, historyRes] = await Promise.all([
          fetch(`/api/attendance/report?class=${selectedClass}&student=${userId}`),
          fetch(`/api/attendance?class=${selectedClass}&student=${userId}`),
        ]);
        const reportData = await reportRes.json();
        const historyData = await historyRes.json();

        if (reportData.report?.[0]) {
          const r = reportData.report[0];
          const present = r.records?.find((x: { status: string }) => x.status === 'present')?.count || 0;
          const absent = r.records?.find((x: { status: string }) => x.status === 'absent')?.count || 0;
          const late = r.records?.find((x: { status: string }) => x.status === 'late')?.count || 0;
          const excused = r.records?.find((x: { status: string }) => x.status === 'excused')?.count || 0;
          setStudentStats({ present, absent, late, excused, total: r.total || 0 });
        }
        setStudentHistory(historyData.records || []);
      } catch {}
      setHistoryLoading(false);
    };
    if (isStudent) loadStudentHistory();
  }, [selectedClass, userId, isStudent]);

  const updateStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setRecords(prev =>
      prev.map(r => r.student === studentId ? { ...r, status } : r)
    );
  };

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Select a class'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          records: records.map(r => ({ studentId: r.student, status: r.status })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Attendance saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const selectedClassData = classDetail || classes.find(c => c._id === selectedClass);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{isStudent ? 'My Attendance' : 'Mark Attendance'}</h1>
          <p className="text-text-muted mt-1">{isStudent ? 'View your attendance records' : 'Record daily student attendance'}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Class</label>
            {isStudent ? (
              <div className="w-full px-4 py-2.5 bg-surface/50 border border-border rounded-xl text-text text-sm">
                {selectedClassData?.name ? `${selectedClassData.name} - ${selectedClassData.section}` : 'Loading...'}
              </div>
            ) : (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Date</label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow"
              />
            </div>
          </div>
          {!isStudent && (
            <div className="flex items-end gap-2">
              <button onClick={() => markAll('present')} className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">All Present</button>
              <button onClick={() => markAll('absent')} className="flex-1 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">All Absent</button>
            </div>
          )}
        </div>
      </div>

      {selectedClass && classDetail && (
        <div className="glass rounded-2xl p-4 border border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="font-semibold">{classDetail.name} - {classDetail.section}</p>
              <p className="text-sm text-text-muted">
                Teacher: {classDetail.teacher?.name || 'N/A'} &middot; {classDetail.students.length} students
              </p>
            </div>
          </div>
        </div>
      )}

      {isStudent ? (
        historyLoading ? (
          <LoadingSpinner />
        ) : !selectedClass ? (
          <EmptyState icon={ClipboardCheck} title="No class assigned" description="You are not assigned to any class. Contact your teacher or admin." />
        ) : (
          <>
            <div className="glass rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-lg font-semibold">{userName || 'Student'}</p>
                  <p className="text-sm text-text-muted">{selectedClassData?.name ? `${selectedClassData.name} - ${selectedClassData.section}` : ''}</p>
                </div>
              </div>
            </div>
            {studentStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Days', value: studentStats.total, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Present', value: studentStats.present, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Absent', value: studentStats.absent, icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Rate', value: studentStats.total > 0 ? `${Math.round(studentStats.present / studentStats.total * 100)}%` : '0%', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className={`glass rounded-2xl p-5 border border-border ${stat.bg}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Icon size={18} className={stat.color} />
                        <span className="text-xs font-medium text-text-muted">{stat.label}</span>
                      </div>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="glass rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-text-muted">Attendance History</p>
              </div>
              {studentHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertTriangle size={24} className="mx-auto text-text-dim mb-2" />
                  <p className="text-sm text-text-muted">No attendance records found.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {studentHistory.map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-4 hover:bg-surface/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <CalendarCheck size={16} className="text-text-dim" />
                        <span className="text-sm font-medium">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${statusColors[record.status] || statusColors.present}`}>
                        {(() => { const Icon = statusIcons[record.status] || statusIcons.present; return <><Icon size={12} /> {record.status.charAt(0).toUpperCase() + record.status.slice(1)}</>; })()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      ) : initialLoading ? (
        <LoadingSpinner />
      ) : !selectedClass ? (
        <EmptyState icon={ClipboardCheck} title="Select a class" description="Choose a class above to start marking attendance." />
      ) : records.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No students" description={`${selectedClassData?.name || 'This class'} has no students assigned.`} />
      ) : (
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-sm text-text-muted">{records.length} students</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
          <div className="divide-y divide-border">
            {records.map((record) => {
              const student = selectedClassData?.students?.find(s => s._id === record.student);
              return (
                <div key={record.student} className="flex items-center justify-between p-4 hover:bg-surface/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {student?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-sm">{student?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['present', 'absent', 'late', 'excused'] as const).map((status) => {
                      const isActive = record.status === status;
                      const Icon = statusIcons[status];
                      return (
                        <button
                          key={status}
                          onClick={() => updateStatus(record.student, status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isActive ? statusColors[status] : 'border-border text-text-dim hover:border-text-dim'
                          }`}
                        >
                          <Icon size={12} />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
