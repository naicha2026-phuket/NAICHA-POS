import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get shift by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift" },
      { status: 500 }
    );
  }
}

// PUT: Update shift (close shift)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { endingCash, cashSales, qrSales, note } = body;

    // Check if shift exists and is open
    const existingShift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    if (existingShift.status === "CLOSED") {
      return NextResponse.json(
        { error: "Shift is already closed" },
        { status: 400 }
      );
    }

    // Update shift with closing information
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        closedAt: new Date(),
        endingCash,
        cashSales,
        qrSales,
        totalSales: (cashSales || 0) + (qrSales || 0),
        status: "CLOSED",
        note: note || null,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(updatedShift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

// DELETE: Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
