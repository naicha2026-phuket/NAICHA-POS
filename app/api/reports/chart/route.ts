import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Calculate the date 3 months ago from today
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Start from the 1st of 3 months ago
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ); // End of this month

    // Fetch all orders in the last 3 months
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: threeMonthsAgo,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalPrice: true,
      },
    });

    // Group by month and day
    const result: Record<string, Record<string, number>> = {};
    for (const order of orders) {
      const date = new Date(order.createdAt);
      const month = date.toLocaleString("en-US", { month: "short" }); // e.g. Jan, Feb
      const day = date.getDate().toString();
      if (!result[month]) result[month] = {};
      if (!result[month][day]) result[month][day] = 0;
      result[month][day] += Number(order.totalPrice) || 0;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.log("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
