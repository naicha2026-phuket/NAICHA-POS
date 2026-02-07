import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date");

    // Build date range
    const date = dateParam ? new Date(dateParam) : new Date();
    const { startOfDay, endOfDay } = getBangkokDayRange(date);

    const whereClause: any = {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    };

    const toppings = await prisma.topping.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    // count each topping usage in orderItems
    const toppingUsageCounts: { [key: string]: number } = {};
    for (const topping of toppings) {
      const count = await prisma.orderItem.count({
        where: {
          toppings: {
            some: {
              id: topping.id,
            },
          },
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      });
      toppingUsageCounts[topping.id] = count;
    }

    const bearMilkCat = await prisma.category.findFirst({
      where: {
        name: "นมหมี ปั่น เย็น",
      },
    });
    // get count of all orders in the date range where category is 'cat'egory'
    const ordersCount = await prisma.orderItem.count({
      where: {
        ...whereClause,
        menu: {
          categoryId: bearMilkCat?.id,
        },
      },
    });

    //map each topping to include usage count
    // add นมหมี ปั่น เย็น orders count as a special topping with id 'bearMilkCat'
    toppings.push({
      id: "bearMilkCat",
      name: "นมหมี ปั่น เย็น",
      price: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: "",
      isAvailable: true,
      description: "นมหมี ปั่น เย็น",
    });
    toppingUsageCounts["bearMilkCat"] = ordersCount;
    const toppingsWithUsage = toppings.map((topping) => ({
      ...topping,
      usageCount: toppingUsageCounts[topping.id] || 0,
    }));

    return NextResponse.json(toppingsWithUsage, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

function getBangkokDayRange(date: Date) {
  // format date in Bangkok
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  });
  const dateString = formatter.format(date); // YYYY-MM-DD in Bangkok time

  // Parse back safely (always UTC midnight, then shift to Bangkok)
  const [year, month, day] = dateString.split("-").map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  return { startOfDay, endOfDay };
}
