import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Class from '@/models/Class';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session');

    const filter: Record<string, unknown> = {};
    if (sessionId) filter.session = sessionId;
    if (user.role === 'teacher') filter.teacher = user._id;

    const classes = await Class.find(filter)
      .populate('teacher', 'name email')
      .populate('session', 'name')
      .sort({ name: 1 });

    return NextResponse.json({ classes });
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
    const { name, section, subject, session, teacher, room, schedule } = body;

    if (!name || !section || !session || !teacher) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();
    const class_ = await Class.create({ name, section, subject, session, teacher, room, schedule });

    const populated = await Class.findById(class_._id)
      .populate('teacher', 'name email')
      .populate('session', 'name');

    return NextResponse.json({ class: populated }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
