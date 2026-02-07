import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // trim the data
    data.name = data.name.trim();
    data.description = data.description.trim();

    const menu = await prisma.menu.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.image,
        categoryId: data.category,
        isAvailable: data.isAvailable,
        recipe: data.recipe,
      },
    });

    // Return the response with a status code 200
    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    // Handle the error and return a response with a status code 500
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const menu = await prisma.menu.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    // Handle the error and return a response with a status code 500
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
