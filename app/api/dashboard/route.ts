import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Today's sales
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
        status: "COMPLETED",
      },
    });

    const todaySales = todayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const todayOrderCount = todayOrders.length;

    // Calculate today's total glasses sold
    const todayGlassesResult = await prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: {
            gte: todayStart,
          },
          status: "COMPLETED",
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const todayGlasses = todayGlassesResult._sum.quantity || 0;

    // Yesterday's sales for comparison
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
        status: "COMPLETED",
      },
    });

    const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const yesterdayOrderCount = yesterdayOrders.length;

    // Calculate yesterday's total glasses sold
    const yesterdayGlassesResult = await prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
          status: "COMPLETED",
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const yesterdayGlasses = yesterdayGlassesResult._sum.quantity || 0;

    // Calculate percentage changes
    const salesChange = yesterdaySales > 0 
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : todaySales > 0 ? 100 : 0;

    const orderChange = yesterdayOrderCount > 0
      ? Math.round(((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100)
      : todayOrderCount > 0 ? 100 : 0;

    const glassesChange = yesterdayGlasses > 0
      ? Math.round(((todayGlasses - yesterdayGlasses) / yesterdayGlasses) * 100)
      : todayGlasses > 0 ? 100 : 0;

    // Total menu count
    const menuCount = await prisma.menu.count({
      where: {
        isAvailable: true,
      },
    });

    // Active staff count
    const staffCount = await prisma.staff.count({
      where: {
        isActive: true,
      },
    });

    // Recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const recentOrdersData = recentOrders.map((order) => ({
      id: order.id.slice(0, 8),
      time: new Date(order.createdAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      }),
      items: order.orderItems
        .map((item) => `${item.menu.name} x${item.quantity}`)
        .join(", "),
      total: order.totalPrice,
      status: order.status.toLowerCase(),
    }));

    // Top selling items today
    const orderItems = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          createdAt: {
            gte: todayStart,
          },
          status: "COMPLETED",
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

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
      },
    });

    const maxSales = orderItems[0]?._sum.quantity || 1;

    const topSelling = orderItems.map((item) => {
      const menu = menus.find((m) => m.id === item.menuId);
      const sales = item._sum.quantity || 0;
      return {
        name: menu?.name || "Unknown",
        sales: sales,
        percentage: Math.round((sales / maxSales) * 100),
      };
    });

    return NextResponse.json(
      {
        stats: {
          todaySales: {
            value: todaySales,
            change: salesChange,
            positive: salesChange >= 0,
          },
          orderCount: {
            value: todayOrderCount,
            change: orderChange,
            positive: orderChange >= 0,
          },
          glassesCount: {
            value: todayGlasses,
            change: glassesChange,
            positive: glassesChange >= 0,
          },
          menuCount: {
            value: menuCount,
            change: 0,
            positive: true,
          },
          staffCount: {
            value: staffCount,
            change: 0,
            positive: true,
          },
        },
        recentOrders: recentOrdersData,
        topSelling: topSelling,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
