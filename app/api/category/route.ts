import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // trim the data
    data.name = data.name.trim();
    data.description = data.description.trim();

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Return the response with a status code 200
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    // Handle the error and return a response with a status code 500
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    // Handle the error and return a response with a status code 500
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
