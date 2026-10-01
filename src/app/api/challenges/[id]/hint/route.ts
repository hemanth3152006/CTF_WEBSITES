import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await context.params;
    const user = await getCurrentUser();

    if (!user || !user.teamId) {
      return NextResponse.json(
        { error: "You must be in a team to unlock hints." },
        { status: 401 }
      );
    }

    const { hintId } = await req.json();
    if (!hintId) {
      return NextResponse.json({ error: "Hint ID is required." }, { status: 400 });
    }

    const hint = await prisma.hint.findFirst({
      where: { id: hintId, challengeId },
    });

    if (!hint) {
      return NextResponse.json({ error: "Hint not found." }, { status: 404 });
    }

    // Check if already unlocked
    const existingUnlock = await prisma.unlockedHint.findUnique({
      where: {
        teamId_hintId: {
          teamId: user.teamId,
          hintId,
        },
      },
    });

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        content: hint.content,
        alreadyUnlocked: true,
      });
    }

    // Unlock hint and deduct cost
    await prisma.$transaction(async (tx) => {
      await tx.unlockedHint.create({
        data: {
          teamId: user.teamId!,
          userId: user.id,
          hintId,
        },
      });

      if (hint.cost > 0) {
        await tx.team.update({
          where: { id: user.teamId! },
          data: {
            points: { decrement: hint.cost },
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      content: hint.content,
      costDeducted: hint.cost,
    });
  } catch (error) {
    console.error("Unlock hint error:", error);
    return NextResponse.json({ error: "Failed to unlock hint." }, { status: 500 });
  }
}
