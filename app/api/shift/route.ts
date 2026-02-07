import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Create new shift (open shift)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, startingCash } = body;

    if (!staffId || startingCash === undefined) {
      return NextResponse.json(
        { error: "staffId and startingCash are required" },
        { status: 400 }
      );
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Check if there's already an open shift for this staff
    const existingOpenShift = await prisma.shift.findFirst({
      where: {
        staffId,
        status: "OPEN",
      },
    });

    if (existingOpenShift) {
      return NextResponse.json(
        { error: "Staff already has an open shift" },
        { status: 400 }
      );
    }

    // Create new shift
    const shift = await prisma.shift.create({
      data: {
        staffId,
        startingCash,
        status: "OPEN",
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

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}

// GET: Get shifts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.openedAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}
