import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { phone, pin } = data;
    const member = await prisma.members.findFirst({
      where: {
        phone,
      },
    });
    if (!member) {
      return NextResponse.json(
        { error: "ไม่พบหมายเลขโทรศัพท์" },
        { status: 401 }
      );
    }
    if (member.pin !== pin) {
      return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
    }
    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "ไม่สามารถเข้าสู่ระบบได้" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
