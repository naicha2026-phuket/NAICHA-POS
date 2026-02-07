import { Description } from "@radix-ui/react-toast";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const now = new Date();
    const exp = new Date(now);
    exp.setDate(exp.getDate() + 1);

    const code = `DISCOUNT_${data.ownerId}_${Date.now()}`;

    let discount;
    console.log("amount:", data.amount, typeof data.amount);

    await prisma.$transaction(async (tx) => {
      discount = await tx.discount.create({
        data: {
          code: code,
          description: data.description,
          amount: Number(data.amount), // Convert to string
          ownerId: data.ownerId,
          pointsUsed: Number(data.pointsUsed),
          expiration: exp, // <-- crucial fix
        },
      });

      await tx.members.update({
        where: { id: data.ownerId },
        data: { points: { decrement: Number(data.pointsUsed) } },
      });
    });

    return NextResponse.json(discount, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
