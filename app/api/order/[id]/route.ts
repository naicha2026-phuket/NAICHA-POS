import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const data = await req.json();

  try {
    const orderExists = await prisma.order.findUnique({
      where: { id },
    });
    if (!orderExists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (data.status === "PROCESSING" && orderExists.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "Order must be in PENDING status to be updated to PROCESSING",
        },
        { status: 400 }
      );
    }
    const updatedOrder = await prisma.order.update({
      where: { id },
      data,
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
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
