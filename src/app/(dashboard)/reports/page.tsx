'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { BarChart3, Download } from 'lucide-react';

interface ReportEntry {
  _id: string;
  student: { _id: string; name: string; email: string };
  total: number;
  records: { status: string; count: number }[];
}

interface ClassData {
  _id: string;
  name: string;
  section: string;
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const loadClasses = () => fetch('/api/classes').then(r => r.json()).then(d => {
      if (d.classes) setClasses(d.classes);
      setLoading(false);
    });
    loadClasses();
    const onFocus = () => fetch('/api/classes').then(r => r.json()).then(d => {
      if (d.classes) setClasses(d.classes);
    });
    const onVisible = () => { if (!document.hidden) onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(onFocus, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const fetchReport = useCallback(async () => {
    if (!selectedClass) { toast.error('Select a class'); return; }
    setReportLoading(true);
    try {
      const res = await fetch(`/api/attendance/report?class=${selectedClass}`);
      const data = await res.json();
      if (res.ok) setReport(data.report);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setReportLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;
    fetchReport();
    const onFocus = () => fetchReport();
    const onVisible = () => { if (!document.hidden) fetchReport(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(fetchReport, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [selectedClass, fetchReport]);

  const getPercentage = (entry: ReportEntry, status: string) => {
    const record = entry.records.find(r => r.status === status);
    return record ? Math.round((record.count / entry.total) * 100) : 0;
  };

  const exportCSV = () => {
    if (report.length === 0) return;
    let csv = 'Student Name,Email,Total,Present%,Absent%,Late%,Excused%\n';
    report.forEach(r => {
      csv += `${r.student.name},${r.student.email},${r.total},${getPercentage(r, 'present')}%,${getPercentage(r, 'absent')}%,${getPercentage(r, 'late')}%,${getPercentage(r, 'excused')}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-text-muted mt-1">View and export attendance analytics</p>
        </div>
        {report.length > 0 && (
          <button onClick={exportCSV} className="btn-gradient-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white">
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>

      <div className="glass rounded-2xl p-6 border border-border">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-text-muted mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-text focus:outline-none input-glow"
          >
            <option value="">Choose a class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
            ))}
          </select>
        </div>
      </div>

      {reportLoading ? (
        <LoadingSpinner />
      ) : !selectedClass ? (
        <EmptyState icon={BarChart3} title="Select a class" description="Choose a class to view attendance reports." />
      ) : report.length === 0 ? (
        <EmptyState icon={BarChart3} title="No data yet" description="No attendance records found for this class." />
      ) : (
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-text-muted">Student</th>
                  <th className="text-center p-4 text-sm font-medium text-text-muted">Total</th>
                  <th className="text-center p-4 text-sm font-medium text-emerald-400">Present</th>
                  <th className="text-center p-4 text-sm font-medium text-red-400">Absent</th>
                  <th className="text-center p-4 text-sm font-medium text-amber-400">Late</th>
                  <th className="text-center p-4 text-sm font-medium text-blue-400">Excused</th>
                  <th className="text-center p-4 text-sm font-medium text-text-muted">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.map((entry) => {
                  const presentPct = getPercentage(entry, 'present');
                  return (
                    <tr key={entry._id} className="hover:bg-surface/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {entry.student?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{entry.student?.name || 'Unknown'}</p>
                            <p className="text-xs text-text-dim">{entry.student?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm font-medium">{entry.total}</td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-medium text-emerald-400">{getPercentage(entry, 'present')}%</span>
                        <div className="w-full h-1.5 bg-surface-light rounded-full mt-1 max-w-[60px] mx-auto">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${presentPct}%` }} />
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-red-400">{getPercentage(entry, 'absent')}%</td>
                      <td className="p-4 text-center text-sm text-amber-400">{getPercentage(entry, 'late')}%</td>
                      <td className="p-4 text-center text-sm text-blue-400">{getPercentage(entry, 'excused')}%</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                          presentPct >= 75 ? 'bg-emerald-500/10 text-emerald-400' :
                          presentPct >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {presentPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
