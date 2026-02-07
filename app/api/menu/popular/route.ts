import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const popularMenu = await prisma.orderItem.groupBy({
      by: ["menuId"],
      _count: {
        menuId: true,
      },
      orderBy: {
        _count: {
          menuId: "desc",
        },
      },
      take: 10, // Get top 10 popular items
    });

    // Map popularMenu to include menu details
    const popularMenuDetails = await Promise.all(
      popularMenu.map(async (item) => {
        const menuItem = await prisma.menu.findUnique({
          where: { id: item.menuId },
          include: {
            category: true,
          },
        });
        return {
          ...menuItem,
          popularity: item._count.menuId,
        };
      })
    );

    return NextResponse.json(popularMenuDetails, { status: 200 });
  } catch (error) {
    // Handle the error and return a response with a status code 500
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
