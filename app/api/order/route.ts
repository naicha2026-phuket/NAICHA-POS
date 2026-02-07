import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Create order with order items
    const order = await prisma.order.create({
      data: {
        name: data.name,
        phone: data.phone,
        totalPrice: data.totalPrice,
        status: data.status || "COMPLETED",
        paymentMethod: data.paymentMethod === "cash" ? "CASH" : "BANK_TRANSFER",
        amountReceived: data.amountReceived,
        change: data.change,
        isPaid: data.isPaid || true,
        note: data.note,
        memberId: data.memberId || null,
        discountAmount: data.discountAmount || 0,
        pointsEarned: data.pointsEarned || 0,
        pointsUsed: data.pointsUsed || 0,
        createdBy: data.createdBy || null,
        shiftId: data.shiftId || null,
        orderItems: {
          create: data.orderItems.map((item: any) => ({
            menuId: item.menuId,
            quantity: item.quantity,
            sweetness: item.sweetness || "NORMAL",
            note: item.note,
            toppings: item.toppings && item.toppings.length > 0 ? {
              connect: item.toppings.map((toppingId: string) => ({ id: toppingId }))
            } : undefined,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            menu: {
              include: {
                category: true,
              },
            },
            toppings: true,
          },
        },
        member: true,
      },
    });

    // Update member points if member exists
    if (data.memberId && (data.pointsEarned || data.pointsUsed)) {
      await prisma.members.update({
        where: { id: data.memberId },
        data: { 
          points: { 
            increment: data.pointsEarned - (data.pointsUsed || 0)
          } 
        },
      });

      // Count total glasses purchased by this member and update tier
      const totalGlassesResult = await prisma.orderItem.aggregate({
        where: {
          order: {
            memberId: data.memberId,
            status: "COMPLETED"
          }
        },
        _sum: {
          quantity: true
        }
      });

      const totalGlasses = totalGlassesResult._sum.quantity || 0;

      // Determine tier based on total glasses
      let newTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
      if (totalGlasses >= 100) {
        newTier = "PLATINUM";
      } else if (totalGlasses >= 50) {
        newTier = "GOLD";
      } else if (totalGlasses >= 10) {
        newTier = "SILVER";
      }

      // Update member tier
      await prisma.members.update({
        where: { id: data.memberId },
        data: { tier: newTier }
      });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date");
    const statusParam = request.nextUrl.searchParams.get("status");

    const whereClause: any = {};

    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (statusParam) {
      whereClause.status = statusParam.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menu: {
              include: {
                category: true,
              },
            },
            toppings: true,
          },
        },
        member: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status, note } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Get the order before cancellation
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        member: true,
        orderItems: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status.toUpperCase(),
        note: note || existingOrder.note,
      },
      include: {
        orderItems: {
          include: {
            menu: {
              include: {
                category: true,
              },
            },
            toppings: true,
          },
        },
        member: true,
        staff: true,
      },
    });

    // If cancelling and order had a member, revert points and recalculate tier
    if (status.toUpperCase() === "CANCELLED" && existingOrder.memberId) {
      // Revert points: remove earned points and restore used points
      const pointsToRevert = existingOrder.pointsEarned - existingOrder.pointsUsed;
      
      await prisma.members.update({
        where: { id: existingOrder.memberId },
        data: {
          points: {
            decrement: pointsToRevert,
          },
        },
      });

      // Recalculate tier based on remaining completed orders
      const totalGlassesResult = await prisma.orderItem.aggregate({
        where: {
          order: {
            memberId: existingOrder.memberId,
            status: "COMPLETED",
          },
        },
        _sum: {
          quantity: true,
        },
      });

      const totalGlasses = totalGlassesResult._sum.quantity || 0;

      // Determine tier based on total glasses
      let newTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
      if (totalGlasses >= 100) {
        newTier = "PLATINUM";
      } else if (totalGlasses >= 50) {
        newTier = "GOLD";
      } else if (totalGlasses >= 10) {
        newTier = "SILVER";
      }

      // Update member tier
      await prisma.members.update({
        where: { id: existingOrder.memberId },
        data: { tier: newTier },
      });
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
