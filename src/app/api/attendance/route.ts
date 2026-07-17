import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';
import AcademicSession from '@/models/AcademicSession';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class');
    const date = searchParams.get('date');
    const studentId = searchParams.get('student');

    const filter: Record<string, unknown> = {};
    if (classId) filter.class = classId;
    if (date) filter.date = new Date(date);
    if (studentId) filter.student = studentId;

    const records = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('class', 'name section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { classId, date, records } = body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const class_ = await Class.findById(classId);
    if (!class_) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const activeSession = await AcademicSession.findOne({ isActive: true });
    if (!activeSession) return NextResponse.json({ error: 'No active session found' }, { status: 400 });
    const sessionId = activeSession._id;

    const attendanceDate = new Date(date);

    const operations = records.map((r: { studentId: string; status: string; remark?: string }) => ({
      updateOne: {
        filter: { student: r.studentId, class: classId, date: attendanceDate },
        update: {
          $set: {
            student: r.studentId,
            class: classId,
            session: sessionId,
            date: attendanceDate,
            status: r.status,
            markedBy: user._id,
            method: 'manual',
            remark: r.remark || '',
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    return NextResponse.json({ success: true, message: 'Attendance saved successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
