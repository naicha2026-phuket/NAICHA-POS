import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const lastMonth = url.searchParams.get("lastMonth");

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date();
    lastDayOfMonth.setHours(23, 59, 59, 999);
    const datenow = new Date();
    datenow.setHours(0, 0, 0, 0); // Normalize today's start
    const monthly = await prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
      _avg: {
        totalPrice: true,
      },
      where: {
        createdAt: {
          gte: lastMonth
            ? new Date(new Date().getFullYear(), new Date().getMonth() - 1)
            : firstDayOfMonth,
          lte: lastMonth
            ? new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                0,
                23,
                59,
                59,
                999
              )
            : datenow,
        },
      },
    });
    // count group by menu item
    const orderItems = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _count: {
        menuId: true,
      },
      _sum: {
        quantity: true, // Assuming you have a quantity field in your orderItem
      },
      where: {
        order: {
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      },
      orderBy: {
        _count: {
          menuId: "desc",
        },
      },
    });

    const orderQuantity = await prisma.orderItem.aggregate({
      _sum: {
        quantity: true, // Assuming you have a quantity field in your orderItem
      },
      where: {
        order: {
          createdAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      },
    });

    // get menu name math with orderItems
    const menuIds = orderItems.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true, // Assuming you have a price field in your menu
        category: {
          select: {
            name: true,
          },
        },
      },
    });
    // map orderItems to include menu name
    const orderItemsWithMenu = orderItems.map((item) => {
      const menu = menus.find((menu) => menu.id === item.menuId);
      return {
        menuId: item.menuId,
        count: item._count.menuId,
        menuName: menu ? menu.name : "Unknown",
        categoryName: menu ? menu.category.name : "Unknown",
        imageUrl: menu ? menu.imageUrl : null,
        revenue: item._count.menuId * (menu ? menu.price : 0), // Assuming menu has a price field
      };
    });

    // sum total price day by day last 7 days
    const today = new Date();

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    today.setHours(0, 0, 0, 0); // Normalize today's start

    const dateFrom = from ? new Date(from) : new Date(today);
    const dateTo = to ? new Date(to) : new Date(today);
    dateFrom.setHours(0, 0, 0, 0); // Normalize start date
    dateTo.setHours(23, 59, 59, 999); // Normalize end date
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateFrom, // Start from 7 days ago
          lte: dateTo, // Up to today
        },
      },
      orderBy: {
        createdAt: "asc", // Order by date ascending
      },
    });

    const rangeDate = Array.from(
      {
        length:
          (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24) + 1,
      },
      (_, i) => {
        const date = new Date(dateFrom);
        date.setDate(dateFrom.getDate() + i);
        return date;
      }
    );

    const dailySales = rangeDate.map((date) => {
      const dateString = date.toLocaleDateString("en-CA"); // Format date to YYYY-MM-DD
      const totalPrice = orders
        .filter(
          (order) => order.createdAt.toISOString().split("T")[0] === dateString
        )
        .reduce((sum, order) => sum + order.totalPrice, 0);
      return {
        createdAt: `${dateString}`, // Ensure the date is in ISO format
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        _sum: { totalPrice: totalPrice },
      };
    });

    return NextResponse.json(
      {
        monthly: monthly,
        bestSellers: orderItemsWithMenu.slice(0, 10), // Top 5 best-selling items
        dailySales: dailySales,
        orderQuantity: orderQuantity._sum.quantity || 0, // Total quantity sold in the month
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle the error and return a response with a status code 500
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
