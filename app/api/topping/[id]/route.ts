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
    if (data.name) data.name = data.name.trim();

    const topping = await prisma.topping.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        isAvailable: data.isAvailable ?? true,
      },
    });

    return NextResponse.json(topping, { status: 200 });
  } catch (error) {
    console.error("Error updating topping:", error);
    return NextResponse.json(
      { error: "Failed to update topping" },
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

    await prisma.topping.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Topping deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting topping:", error);
    return NextResponse.json(
      { error: "Failed to delete topping" },
      { status: 500 }
    );
  }
}
