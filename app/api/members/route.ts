import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // trim the data
    data.name = data.name?.trim();
    data.phone = data.phone.trim();
    data.email = data.email?.trim();
    data.points = parseInt(data?.points, 10) || 0;
    data.pin = data.pin?.trim();

    // check phone exist
    const existingMember = await prisma.members.findUnique({
      where: {
        phone: data.phone,
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "หมายเลขโทรศัพท์นี้ถูกลงทะเบียนแล้ว" },
        { status: 400 }
      );
    }

    const member = await prisma.members.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        points: data.points,
        pin: data.pin,
      },
    });

    // Return the response with a status code 200
    return NextResponse.json(member, { status: 200 });
  } catch (error) {
    console.log("Error creating member:", error);

    // Handle the error and return a response with a status code 500
    return NextResponse.json(
      { error: "ไม่สามารถสร้างสมาชิกได้" },
      { status: 500 }
    );
  }
}

// get members
export async function GET(request: NextRequest) {
  try {
    const members = await prisma.members.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to retrieve members" },
      { status: 500 }
    );
  }
}
