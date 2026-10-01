import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { teamId, isBanned, pointsAdjustment } = await req.json();
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
    }

    const updateData: { isBanned?: boolean; points?: { increment: number } } = {};
    if (typeof isBanned === "boolean") {
      updateData.isBanned = isBanned;
    }
    if (typeof pointsAdjustment === "number" && !isNaN(pointsAdjustment)) {
      updateData.points = { increment: pointsAdjustment };
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Admin team update error:", error);
    return NextResponse.json({ error: "Failed to update team." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { action, teamId, memberId } = await req.json();
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
    }

    if (action === "remove-member") {
      if (!memberId) {
        return NextResponse.json({ error: "Member ID is required." }, { status: 400 });
      }

      const result = await prisma.user.updateMany({
        where: { id: memberId, teamId },
        data: { teamId: null },
      });

      if (result.count === 0) {
        return NextResponse.json({ error: "Team member not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Team member removed." });
    }

    if (action === "delete-team") {
      const result = await prisma.team.deleteMany({ where: { id: teamId } });
      if (result.count === 0) {
        return NextResponse.json({ error: "Team not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Team deleted." });
    }

    return NextResponse.json({ error: "Invalid team deletion action." }, { status: 400 });
  } catch (error) {
    console.error("Admin team deletion error:", error);
    return NextResponse.json({ error: "Failed to delete team data." }, { status: 500 });
  }
}
