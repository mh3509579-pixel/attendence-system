import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Attendance from '@/models/Attendance';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class');
    const sessionId = searchParams.get('session');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('student');

    const match: Record<string, unknown> = {};
    if (classId) match.class = classId;
    if (sessionId) match.session = sessionId;
    if (studentId) match.student = studentId;
    if (startDate || endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      match.date = dateFilter;
    }

    const report = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { student: '$student', status: '$status' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.student',
          records: {
            $push: { status: '$_id.status', count: '$count' },
          },
          total: { $sum: '$count' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      { $sort: { 'student.name': 1 } },
    ]);

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
