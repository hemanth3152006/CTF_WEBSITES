import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (user.teamId) {
      return NextResponse.json({ error: "You are already a member of a team." }, { status: 400 });
    }

    const { name, affiliation } = await req.json();
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Team name must be at least 3 characters." }, { status: 400 });
    }

    const existing = await prisma.team.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Team name already taken." }, { status: 409 });
    }

    const joinCode = `${name.trim().slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "X")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        joinCode,
        affiliation: affiliation?.trim() || null,
        members: {
          connect: { id: user.id },
        },
      },
      include: {
        members: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json({ error: "Failed to create team." }, { status: 500 });
  }
}
