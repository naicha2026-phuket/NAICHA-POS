import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const member = await prisma.members.findUnique({
      where: { id },
    });
    if (!member) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }
    const discount = await prisma.discount.findMany({
      where: {
        ownerId: id,
      },
    });

    return NextResponse.json(discount);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
