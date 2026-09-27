import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyFlag } from "@/lib/flags";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: challengeId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    if (!user.teamId || !user.team) {
      return NextResponse.json(
        { error: "You must join or create a team before submitting flags." },
        { status: 403 }
      );
    }

    if (user.team.isBanned) {
      return NextResponse.json(
        { error: "Your team has been disqualified." },
        { status: 403 }
      );
    }

    // Verify Event Status (Active vs Paused vs Ended)
    const eventConfig = await prisma.eventConfig.findUnique({ where: { id: "global" } });
    if (eventConfig?.isPaused) {
      return NextResponse.json(
        { error: "The competition is currently PAUSED by organizers. Flag submissions are temporarily blocked." },
        { status: 403 }
      );
    }
    if (eventConfig && !eventConfig.isPaused && Date.now() > eventConfig.endTime.getTime()) {
      return NextResponse.json(
        { error: "The competition has concluded. Flag submissions are closed." },
        { status: 403 }
      );
    }

    // Rate Limiting Protection (5 attempts per 30 seconds per team + challenge)
    const rateLimitKey = `sub_${user.teamId}_${challengeId}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 30 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded! Brute-forcing is prohibited. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
          retryAfter: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const { flag } = await req.json();
    if (!flag || typeof flag !== "string" || !flag.trim()) {
      return NextResponse.json({ error: "Flag cannot be empty." }, { status: 400 });
    }

    // Verify Challenge Exists & Is Visible
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { solves: true },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    if (!challenge.isVisible) {
      return NextResponse.json(
        { error: "This challenge is currently locked or hidden by event organizers." },
        { status: 403 }
      );
    }

    if (challenge.isPaused && (!challenge.pausedUntil || challenge.pausedUntil.getTime() > Date.now())) {
      return NextResponse.json(
        { error: "This challenge is temporarily paused. Please wait for it to return." },
        { status: 403 }
      );
    }

    // Check if team already solved this challenge
    const alreadySolved = await prisma.solve.findUnique({
      where: {
        teamId_challengeId: {
          teamId: user.teamId,
          challengeId,
        },
      },
    });

    if (alreadySolved) {
      return NextResponse.json(
        { error: "Your team has already solved this challenge!" },
        { status: 400 }
      );
    }

    // Client IP for anti-cheat logging
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    const isMatch = verifyFlag(flag, challenge.flagHash);

    if (!isMatch) {
      // Log failed attempt for anti-cheat analysis
      await prisma.submission.create({
        data: {
          teamId: user.teamId,
          userId: user.id,
          challengeId,
          submittedFlag: flag.trim().slice(0, 100), // sanitize length
          isCorrect: false,
          pointsAwarded: 0,
          ipAddress,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Incorrect flag. Keep digging!",
          remainingAttempts: rateCheck.remaining,
        },
        { status: 400 }
      );
    }

    // Flag is correct! Check for First Blood
    const isFirstBlood = challenge.solves.length === 0;
    const pointsToAward = challenge.points;

    // Atomic transaction to guarantee consistency and race condition immunity
    await prisma.$transaction(async (tx) => {
      // 1. Create Solve record
      await tx.solve.create({
        data: {
          teamId: user.teamId!,
          userId: user.id,
          challengeId,
          points: pointsToAward,
          isFirstBlood,
        },
      });

      // 2. Log correct submission
      await tx.submission.create({
        data: {
          teamId: user.teamId!,
          userId: user.id,
          challengeId,
          submittedFlag: flag.trim().slice(0, 100),
          isCorrect: true,
          pointsAwarded: pointsToAward,
          isFirstBlood,
          ipAddress,
        },
      });

      // 3. Update Team points & last submission timestamp for tie-breaking
      await tx.team.update({
        where: { id: user.teamId! },
        data: {
          points: { increment: pointsToAward },
          lastSubmissionTime: new Date(),
        },
      });

      // 4. Update Challenge solve count
      await tx.challenge.update({
        where: { id: challengeId },
        data: {
          solveCount: { increment: 1 },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: isFirstBlood
        ? "🩸 FIRST BLOOD! Outstanding work! You conquered this challenge first!"
        : "🚩 Correct Flag! Points awarded to your team!",
      pointsAwarded: pointsToAward,
      isFirstBlood,
    });
  } catch (error) {
    console.error("Flag submission error:", error);
    return NextResponse.json({ error: "Failed to submit flag." }, { status: 500 });
  }
}
