import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const teamId = user?.teamId;

    const isAdmin = user?.role === "ADMIN";

    // Fetch challenges: Admins see all (including hidden), participants only see visible
    const challenges = await prisma.challenge.findMany({
      where: isAdmin ? undefined : { isVisible: true },
      orderBy: [{ category: "asc" }, { level: "asc" }, { points: "asc" }],
      include: {
        hints: {
          select: {
            id: true,
            cost: true,
          },
        },
        solves: {
          select: {
            teamId: true,
            isFirstBlood: true,
            team: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Check which hints the current team has unlocked
    let unlockedHintIds = new Set<string>();
    if (teamId) {
      const unlocked = await prisma.unlockedHint.findMany({
        where: { teamId },
        select: { hintId: true },
      });
      unlockedHintIds = new Set(unlocked.map((u) => u.hintId));
    }

    // Sanitize challenge payloads: NEVER expose flag or flagHash
    const sanitizedChallenges = challenges.map((ch) => {
      const isSolved = teamId ? ch.solves.some((s) => s.teamId === teamId) : false;
      const firstBloodSolve = ch.solves.find((s) => s.isFirstBlood);

      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        category: ch.category,
        level: ch.level,
        difficulty: ch.difficulty,
        points: ch.points,
        flagFormat: ch.flagFormat || "CTF{...}",
        fileUrl: ch.fileUrl,
        fileName: ch.fileName,
        fileSize: ch.fileSize,
        solveCount: ch.solves.length,
        isVisible: ch.isVisible,
        isSolved,
        firstBlood: firstBloodSolve ? firstBloodSolve.team.name : null,
        hints: ch.hints.map((h) => ({
          id: h.id,
          cost: h.cost,
          isUnlocked: unlockedHintIds.has(h.id),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      challenges: sanitizedChallenges,
      userTeamId: teamId || null,
    });
  } catch (error) {
    console.error("Fetch challenges error:", error);
    return NextResponse.json({ error: "Failed to load challenges." }, { status: 500 });
  }
}
