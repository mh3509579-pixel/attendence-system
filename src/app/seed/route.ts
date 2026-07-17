import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import User from '@/models/User';
import AcademicSession from '@/models/AcademicSession';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Database already seeded' });
    }

    const adminPassword = await hashPassword('admin123');
    const teacherPassword = await hashPassword('teacher123');
    const studentPassword = await hashPassword('student123');
    const parentPassword = await hashPassword('parent123');

    const makeUser = (data: Record<string, unknown>) => ({ isActive: true, ...data });

    const admin = (await User.create(makeUser({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
    }))) as any;

    const teacher = (await User.create(makeUser({
      name: 'Sarah Johnson',
      email: 'sarah@gmail.com',
      password: teacherPassword,
      role: 'teacher',
      phone: '+1 234 567 890',
    }))) as any;

    const teacher2 = (await User.create(makeUser({
      name: 'Michael Chen',
      email: 'michael@gmail.com',
      password: teacherPassword,
      role: 'teacher',
      phone: '+1 234 567 891',
    }))) as any;

    const students = (await User.create([
      makeUser({ name: 'Alice Smith', email: 'alice@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1111' }),
      makeUser({ name: 'Bob Johnson', email: 'bob@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1112' }),
      makeUser({ name: 'Charlie Brown', email: 'charlie@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1113' }),
      makeUser({ name: 'Diana Prince', email: 'diana@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1114' }),
      makeUser({ name: 'Edward Norton', email: 'edward@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1115' }),
      makeUser({ name: 'Fiona Apple', email: 'fiona@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1116' }),
      makeUser({ name: 'George Lucas', email: 'george@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1117' }),
      makeUser({ name: 'Hannah Montana', email: 'hannah@example.com', password: studentPassword, role: 'student', phone: '+1 111 111 1118' }),
    ])) as any[];

    await User.create(makeUser({
      name: 'Parent Smith',
      email: 'parent@example.com',
      password: parentPassword,
      role: 'parent',
      phone: '+1 222 222 2222',
    }));

    const session = (await AcademicSession.create({
      name: '2026 Spring Semester',
      startDate: '2026-01-15T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
      isActive: true,
    })) as any;

    await AcademicSession.create({
      name: '2025 Fall Semester',
      startDate: '2025-08-15T00:00:00.000Z',
      endDate: '2025-12-20T00:00:00.000Z',
      isActive: false,
    });

    const class1 = (await Class.create({
      name: 'Mathematics',
      section: 'A',
      subject: 'Algebra',
      session: session._id,
      teacher: teacher._id,
      students: students.slice(0, 4).map(s => s._id),
      room: '101',
      schedule: 'Mon-Wed-Fri 9:00 AM',
    })) as any;

    const class2 = (await Class.create({
      name: 'Science',
      section: 'B',
      subject: 'Physics',
      session: session._id,
      teacher: teacher2._id,
      students: students.slice(4).map(s => s._id),
      room: '102',
      schedule: 'Tue-Thu 10:00 AM',
    })) as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords: Array<{
      student: string;
      class: string;
      session: string;
      date: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      markedBy: string;
      method: string;
    }> = [];

    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of students) {
        const statuses = ['present', 'present', 'present', 'absent', 'present', 'late'];
        attendanceRecords.push({
          student: student._id,
          class: student._id < students[4]._id ? class1._id : class2._id,
          session: session._id,
          date: date.toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)] as 'present' | 'absent' | 'late' | 'excused',
          markedBy: admin._id,
          method: 'manual',
        });
      }
    }

    await Attendance.insertMany(attendanceRecords as any);

    return NextResponse.json({
      message: 'Database seeded successfully!',
      credentials: {
        admin: { email: 'admin@gmail.com', password: 'admin123' },
        teacher: { email: 'sarah@gmail.com', password: 'teacher123' },
        student: { email: 'alice@example.com', password: 'student123' },
        parent: { email: 'parent@example.com', password: 'parent123' },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
