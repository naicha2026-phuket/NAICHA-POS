import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const member = await prisma.members.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
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
  try {
    const data = await req.json();
    
    // Trim the data
    if (data.name) data.name = data.name.trim();
    if (data.phone) data.phone = data.phone.trim();
    if (data.email) data.email = data.email.trim();

    // Check if phone is being changed and if it already exists
    if (data.phone) {
      const existingMember = await prisma.members.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      });
      
      if (existingMember) {
        return NextResponse.json(
          { error: "หมายเลขโทรศัพท์นี้ถูกใช้งานแล้ว" },
          { status: 400 }
        );
      }
    }

    const member = await prisma.members.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
      },
    });

    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await prisma.members.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Member deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
