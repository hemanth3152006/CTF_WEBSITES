import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
        challenge: { select: { id: true, title: true, points: true, category: true } },
      },
    });

    const teams = await prisma.team.findMany({
      orderBy: { points: "desc" },
      include: {
        members: { select: { id: true, username: true, email: true } },
        solves: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            points: true,
            createdAt: true,
            user: { select: { id: true, username: true } },
            challenge: { select: { id: true, title: true } },
          },
        },
        unlockedHints: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            createdAt: true,
            user: { select: { id: true, username: true } },
            hint: {
              select: {
                cost: true,
                challenge: { select: { id: true, title: true } },
              },
            },
          },
        },
        _count: { select: { solves: true, submissions: true } },
      },
    });

    return NextResponse.json({
      success: true,
      submissions,
      teams,
    });
  } catch (error) {
    console.error("Admin submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to load audit logs." }, { status: 500 });
  }
}
