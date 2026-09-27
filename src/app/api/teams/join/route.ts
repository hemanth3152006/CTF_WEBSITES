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

    const { joinCode } = await req.json();
    if (!joinCode) {
      return NextResponse.json({ error: "Team join code is required." }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "No team found with this join code." }, { status: 404 });
    }

    if (team.isBanned) {
      return NextResponse.json({ error: "This team has been disqualified." }, { status: 403 });
    }

    if (team.members.length >= 4) {
      return NextResponse.json({ error: "Team is already full (maximum 4 members)." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { teamId: team.id },
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        affiliation: team.affiliation,
        points: team.points,
      },
    });
  } catch (error) {
    console.error("Team join error:", error);
    return NextResponse.json({ error: "Failed to join team." }, { status: 500 });
  }
}
