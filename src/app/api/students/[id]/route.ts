import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Class from '@/models/Class';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const student = await User.findById(id).select('-password');
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allClasses = await Class.find({ students: { $in: [id] } });
    const classId = allClasses.length > 0 ? allClasses[0]._id : null;

    return NextResponse.json({ student, classId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await connectDB();
    const student = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.classId !== undefined) {
      const allClasses = await Class.find({ students: { $in: [id] } });
      for (const c of allClasses) {
        await Class.findByIdAndUpdate(c._id, { $pull: { students: id } });
      }
      if (body.classId) {
        await Class.findByIdAndUpdate(body.classId, { $push: { students: id } });
      }
    }

    const classes = await Class.find({ students: { $in: [id] } });
    const classId = classes.length > 0 ? classes[0]._id : null;

    return NextResponse.json({ student, classId });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
