import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Trim the data
    data.name = data.name.trim();
    data.phone = data.phone.trim();
    data.pin = data.pin.trim();

    // Check if phone already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { phone: data.phone },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        phone: data.phone,
        pin: data.pin,
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { shifts: true },
        },
      },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}
