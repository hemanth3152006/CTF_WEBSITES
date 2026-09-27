import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        team: user.team
          ? {
              id: user.team.id,
              name: user.team.name,
              joinCode: user.team.joinCode,
              affiliation: user.team.affiliation,
              points: user.team.points,
              members: user.team.members,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
