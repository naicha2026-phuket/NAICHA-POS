import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;

    // Get member orders with order items
    const orders = await prisma.order.findMany({
      where: {
        memberId: memberId,
      },
      include: {
        orderItems: {
          include: {
            menu: true,
            toppings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching member orders:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลประวัติการซื้อได้" },
      { status: 500 }
    );
  }
}
