import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  try {
    const discount = await prisma.discount.findUnique({
      where: { code },
    });

    if (!discount) {
      return NextResponse.json({ error: "ไม่พบส่วนลด" }, { status: 404 });
    }
    if (discount.expiration && discount.expiration < new Date()) {
      return NextResponse.json({ error: "ส่วนลดหมดอายุ" }, { status: 400 });
    }
    if (discount.isUsed) {
      return NextResponse.json({ error: "ส่วนลดถูกใช้แล้ว" }, { status: 400 });
    }

    return NextResponse.json(discount);
  } catch (error) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
