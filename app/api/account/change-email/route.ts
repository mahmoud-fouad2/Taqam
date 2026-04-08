import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changeEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email(),
});

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = changeEmailSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
    }
    const { currentPassword, newEmail } = parsed.data;

    const normalizedEmail = newEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }

    if (user.email === normalizedEmail) {
      return NextResponse.json({ success: true, message: "لا يوجد تغيير" });
    }

    const existing = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    await prisma.user.updateMany({
      where: { id: session.user.id },
      data: { email: normalizedEmail },
    });

    logger.info("Email changed successfully", { userId: session.user.id });

    return NextResponse.json({ success: true, message: "تم تغيير البريد الإلكتروني بنجاح" });
  } catch (error) {
    logger.error("Error changing email", undefined, error);
    return NextResponse.json({ error: "فشل في تغيير البريد الإلكتروني" }, { status: 500 });
  }
}
