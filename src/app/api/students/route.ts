import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';
import User from '@/models/User';
import Class from '@/models/Class';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = { role: 'student' };
    if (classId) {
      const classDoc = await Class.findById(classId);
      if (classDoc) filter._id = { $in: classDoc.students };
    }
    if (search) filter.name = { $regex: search, $options: 'i' };

    const students = await User.find(filter).select('-password').sort({ name: 1 });
    return NextResponse.json({ students });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, phone, classId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      phone,
      isActive: true,
    });

    if (classId) {
      await Class.findByIdAndUpdate(classId, { $push: { students: student._id } });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { password: _sp, ...studentData } = student as any;
    return NextResponse.json({ student: studentData }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
