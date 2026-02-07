import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // trim the data
    data.name = data.name.trim();

    const topping = await prisma.topping.create({
      data: {
        name: data.name,
        price: data.price,
      },
    });

    return NextResponse.json(topping, { status: 200 });
  } catch (error) {
    console.error("Error creating topping:", error);
    return NextResponse.json(
      { error: "Failed to create topping" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const toppings = await prisma.topping.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(toppings, { status: 200 });
  } catch (error) {
    console.error("Error fetching toppings:", error);
    return NextResponse.json(
      { error: "Failed to fetch toppings" },
      { status: 500 }
    );
  }
}
