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

    // Get all completed orders in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        status: "COMPLETED",
      },
      include: {
        orderItems: {
          include: {
            menu: {
              include: {
                category: true,
              },
            },
          },
        },
        shift: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate summary
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = orders.length;
    const avgPerOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Calculate total glasses sold
    const totalGlasses = orders.reduce((sum, order) => {
      return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    // Daily sales data
    const dailySalesMap = new Map<string, { sales: number; orders: number }>();
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const dayKey = date.toLocaleDateString("en-US", { weekday: "short" });
      const existing = dailySalesMap.get(dayKey) || { sales: 0, orders: 0 };
      dailySalesMap.set(dayKey, {
        sales: existing.sales + order.totalPrice,
        orders: existing.orders + 1,
      });
    });

    const dailySales = Array.from(dailySalesMap.entries()).map(([day, data]) => ({
      day,
      sales: data.sales,
      orders: data.orders,
    }));

    // Hourly sales data
    const hourlySalesMap = new Map<string, number>();
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      // Add 7 hours for Thailand timezone (UTC+7)
      const hour = (date.getUTCHours() + 7) % 24;
      const hourKey = `${hour.toString().padStart(2, "0")}:00`;
      hourlySalesMap.set(hourKey, (hourlySalesMap.get(hourKey) || 0) + order.totalPrice);
    });

    const hourlySales = Array.from(hourlySalesMap.entries())
      .map(([hour, sales]) => ({ hour, sales }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Payment method breakdown
    const cashSales = orders
      .filter((o) => o.paymentMethod === "CASH")
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const qrSales = orders
      .filter((o) => o.paymentMethod === "BANK_TRANSFER")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const cashPercentage = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 0;
    const qrPercentage = totalSales > 0 ? Math.round((qrSales / totalSales) * 100) : 0;

    const paymentSummary = [
      {
        method: "เงินสด",
        amount: cashSales,
        percentage: cashPercentage,
        color: "bg-green-500",
      },
      {
        method: "QR Code",
        amount: qrSales,
        percentage: qrPercentage,
        color: "bg-blue-500",
      },
    ];

    // Shift summary
    const shiftMap = new Map<string, {
      shiftId: string;
      shiftTime: string;
      employee: string;
      sales: number;
      orders: number;
    }>();

    orders.forEach((order) => {
      if (order.shift) {
        const existing = shiftMap.get(order.shift.id) || {
          shiftId: order.shift.id,
          shiftTime: new Date(order.shift.openedAt).toLocaleTimeString("th-TH", { 
            hour: "2-digit", 
            minute: "2-digit",
            timeZone: "Asia/Bangkok"
          }),
          employee: order.shift.staff.name,
          sales: 0,
          orders: 0,
        };
        
        shiftMap.set(order.shift.id, {
          ...existing,
          sales: existing.sales + order.totalPrice,
          orders: existing.orders + 1,
        });
      }
    });

    const shiftSummary = Array.from(shiftMap.values());

    // Best selling items
    const menuSalesMap = new Map<string, {
      menuId: string;
      menuName: string;
      categoryName: string;
      count: number;
      revenue: number;
    }>();

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const existing = menuSalesMap.get(item.menuId) || {
          menuId: item.menuId,
          menuName: item.menu.name,
          categoryName: item.menu.category.name,
          count: 0,
          revenue: 0,
        };
        
        menuSalesMap.set(item.menuId, {
          ...existing,
          count: existing.count + item.quantity,
          revenue: existing.revenue + (item.menu.price * item.quantity),
        });
      });
    });

    const bestSellers = Array.from(menuSalesMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Category breakdown (all menus, not just top 10)
    const categoryMap = new Map<string, { name: string; value: number; count: number }>();
    
    Array.from(menuSalesMap.values()).forEach((item) => {
      const existing = categoryMap.get(item.categoryName) || {
        name: item.categoryName,
        value: 0,
        count: 0,
      };
      
      categoryMap.set(item.categoryName, {
        name: item.categoryName,
        value: existing.value + item.revenue,
        count: existing.count + item.count,
      });
    });

    const categories = Array.from(categoryMap.values());

    return NextResponse.json(
      {
        summary: {
          totalSales,
          totalOrders,
          avgPerOrder,
          totalGlasses,
        },
        dailySales,
        hourlySales,
        paymentSummary,
        shiftSummary,
        bestSellers,
        categories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sales report:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales report" },
      { status: 500 }
    );
  }
}
