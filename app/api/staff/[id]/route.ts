import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const { id } = await params;

    // Trim the data
    data.name = data.name.trim();
    data.phone = data.phone.trim();
    if (data.pin) {
      data.pin = data.pin.trim();
    }

    // Check if phone already exists (excluding current staff)
    const existingStaff = await prisma.staff.findFirst({
      where: {
        phone: data.phone,
        NOT: { id },
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "เบอร์โทรศัพท์นี้มีในระบบแล้ว" },
        { status: 400 }
      );
    }

    const updateData: any = {
      name: data.name,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
    };

    // Only update PIN if provided
    if (data.pin) {
      updateData.pin = data.pin;
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Staff deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    );
  }
}
