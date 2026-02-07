import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const data = await req.json();
    
    // Trim the data if strings are provided
    if (data.name) data.name = data.name.trim();
    if (data.description) data.description = data.description.trim();

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        isAvailable: data.isAvailable,
        recipe: data.recipe,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Menu item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
