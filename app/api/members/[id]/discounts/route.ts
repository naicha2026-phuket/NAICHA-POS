import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;

    // Get orders where member used points (pointsUsed > 0)
    const ordersWithPointsUsed = await prisma.order.findMany({
      where: {
        memberId: memberId,
        pointsUsed: {
          gt: 0,
        },
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

    return NextResponse.json(ordersWithPointsUsed, { status: 200 });
  } catch (error) {
    console.error("Error fetching member orders with points used:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลประวัติการแลกแต้มได้" },
      { status: 500 }
    );
  }
}
