import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [config, teams, challengeCount] = await Promise.all([
      prisma.eventConfig.findUnique({
        where: { id: "global" },
      }),
      prisma.team.findMany({
        where: { isBanned: false },
        orderBy: [
          { points: "desc" },
          { lastSubmissionTime: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          members: {
            select: { id: true, username: true },
          },
          solves: {
            select: {
              id: true,
              points: true,
              isFirstBlood: true,
              createdAt: true,
              challenge: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  points: true,
                },
              },
            },
          },
        },
      }),
      prisma.challenge.count({
        where: { isVisible: true },
      }),
    ]);

    const scoreboard = teams.map((team, index) => {
      const firstBloods = team.solves.filter((s) => s.isFirstBlood).length;
      return {
        rank: index + 1,
        teamId: team.id,
        teamName: team.name,
        affiliation: team.affiliation,
        points: team.points,
        solveCount: team.solves.length,
        firstBloods,
        lastSubmissionTime: team.lastSubmissionTime,
        members: team.members.map((m) => m.username),
        solves: team.solves.map((s) => ({
          challengeId: s.challenge.id,
          challengeTitle: s.challenge.title,
          category: s.challenge.category,
          points: s.points,
          isFirstBlood: s.isFirstBlood,
          solvedAt: s.createdAt,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      challengeCount,
      event: {
        title: config?.title || "24-Hour College CTF",
        isFrozen: config?.isFrozen || false,
        endTime: config?.endTime,
        startTime: config?.startTime,
      },
      scoreboard,
    });
  } catch (error) {
    console.error("Scoreboard fetch error:", error);
    return NextResponse.json({ error: "Failed to load scoreboard." }, { status: 500 });
  }
}
