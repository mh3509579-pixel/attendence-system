import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import AcademicSession from '@/models/AcademicSession';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const activeSession = await AcademicSession.findOne({ isActive: true });

    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalClasses = await Class.countDocuments({ isActive: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayPresent = 0, todayAbsent = 0, todayLate = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classAttendance: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classStudentCounts: any[] = [];

    if (activeSession) {
      const todayRecords = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow },
            session: activeSession._id,
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      todayRecords.forEach((r: { _id: string; count: number }) => {
        if (r._id === 'present') todayPresent = r.count;
        else if (r._id === 'absent') todayAbsent = r.count;
        else if (r._id === 'late') todayLate = r.count;
      });

      const allClasses = await Class.find({ isActive: true });
      for (const cls of allClasses) {
        const records = await Attendance.find({ class: cls._id, date: { $gte: today, $lt: tomorrow }, session: activeSession._id })
          .populate('student', 'name email')
          .lean();
        classAttendance.push({
          class: { _id: cls._id, name: cls.name, section: cls.section },
          present: records.filter((r: Record<string, unknown>) => r.status === 'present').map((r: Record<string, unknown>) => (r as any).student),
          absent: records.filter((r: Record<string, unknown>) => r.status === 'absent').map((r: Record<string, unknown>) => (r as any).student),
          late: records.filter((r: Record<string, unknown>) => r.status === 'late').map((r: Record<string, unknown>) => (r as any).student),
        });
        const students = cls.students || [];
        const studentDocs = await Promise.all(students.map((sid: string) => User.findById(sid).select('name email')));
        classStudentCounts.push({ name: cls.name, section: cls.section, count: studentDocs.filter(Boolean).length, students: studentDocs.filter(Boolean) });
      }
    }

    const totalToday = todayPresent + todayAbsent + todayLate;
    const overallPercentage = totalToday > 0 ? Math.round((todayPresent / totalToday) * 100) : 0;

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekRecords = await Attendance.countDocuments({
      date: { $gte: lastWeek, $lt: today },
      status: 'present',
    });
    const lastWeekTotal = await Attendance.countDocuments({
      date: { $gte: lastWeek, $lt: today },
    });
    const lastWeekPercentage = lastWeekTotal > 0 ? Math.round((lastWeekRecords / lastWeekTotal) * 100) : 0;
    const weeklyTrend = overallPercentage - lastWeekPercentage;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recentActivity: any[] = [];
    if (activeSession) {
      recentActivity = await Attendance.find({ session: activeSession._id })
        .populate('student', 'name')
        .populate('class', 'name section')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    return NextResponse.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayPresent,
        todayAbsent,
        todayLate,
        totalToday,
        overallPercentage,
        weeklyTrend,
        activeSession: activeSession?.name || null,
      },
      classAttendance,
      classStudentCounts,
      recentActivity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
