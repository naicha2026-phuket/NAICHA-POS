import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "week";

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
    }

    // Get previous period for growth calculation
    const periodLength = now.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    // Get bestselling menus with their revenue
    const bestsellerMenus = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _sum: {
        quantity: true,
      },
      _count: {
        menuId: true,
      },
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
        },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    // Get previous period data for growth calculation
    const previousPeriodMenus = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _sum: {
        quantity: true,
      },
      where: {
        menuId: {
          in: bestsellerMenus.map((item) => item.menuId),
        },
        order: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
          status: "COMPLETED",
        },
      },
    });

    // Get menu details
    const menuIds = bestsellerMenus.map((item) => item.menuId);
    const menus = await prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate revenue and growth for each menu
    const bestsellerData = bestsellerMenus.map((item, index) => {
      const menu = menus.find((m) => m.id === item.menuId);
      const previousSales = previousPeriodMenus.find((p) => p.menuId === item.menuId)?._sum.quantity || 0;
      const currentSales = item._sum.quantity || 0;
      const growth = previousSales > 0 
        ? Math.round(((currentSales - previousSales) / previousSales) * 100)
        : currentSales > 0 ? 100 : 0;

      return {
        rank: index + 1,
        name: menu?.name || "Unknown",
        sales: currentSales,
        revenue: currentSales * (menu?.price || 0),
        growth: growth,
        categoryName: menu?.category.name || "Unknown",
      };
    });

    // Get category breakdown
    const categoryBreakdown = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _sum: {
        quantity: true,
      },
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
        },
      },
    });

    const menuCategories = await prisma.menu.findMany({
      where: {
        id: {
          in: categoryBreakdown.map((item) => item.menuId),
        },
      },
      select: {
        id: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const categoryData = categoryBreakdown.reduce((acc: any, item) => {
      const menu = menuCategories.find((m) => m.id === item.menuId);
      const categoryName = menu?.category.name || "Unknown";
      
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          value: 0,
        };
      }
      
      acc[categoryName].value += item._sum.quantity || 0;
      return acc;
    }, {});

    const categoryArray = Object.values(categoryData);

    // Get top toppings
    const toppingOrders = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: "COMPLETED",
        },
      },
      include: {
        toppings: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    const toppingStats = toppingOrders.reduce((acc: any, orderItem) => {
      orderItem.toppings.forEach((topping) => {
        if (!acc[topping.id]) {
          acc[topping.id] = {
            id: topping.id,
            name: topping.name,
            orders: 0,
            revenue: 0,
            price: topping.price,
          };
        }
        acc[topping.id].orders += orderItem.quantity;
        acc[topping.id].revenue += topping.price * orderItem.quantity;
      });
      return acc;
    }, {});

    const toppingData = Object.values(toppingStats)
      .sort((a: any, b: any) => b.orders - a.orders)
      .slice(0, 5)
      .map((item: any, index) => ({
        rank: index + 1,
        name: item.name,
        orders: item.orders,
        revenue: item.revenue,
      }));

    return NextResponse.json(
      {
        bestsellers: bestsellerData,
        categories: categoryArray,
        toppings: toppingData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch bestsellers" },
      { status: 500 }
    );
  }
}
