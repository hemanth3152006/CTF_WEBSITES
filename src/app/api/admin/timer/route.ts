import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { action, durationHours } = await req.json();

    const config = await prisma.eventConfig.findUnique({
      where: { id: "global" },
    });

    if (!config) {
      return NextResponse.json({ error: "Event configuration not found." }, { status: 404 });
    }

    const now = Date.now();

    if (action === "pause") {
      if (config.isPaused) {
        return NextResponse.json({ success: true, message: "Timer already paused.", config });
      }

      const remainingSeconds = Math.max(0, Math.floor((config.endTime.getTime() - now) / 1000));
      const updated = await prisma.eventConfig.update({
        where: { id: "global" },
        data: {
          isPaused: true,
          pausedRemainingSeconds: remainingSeconds,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Event timer PAUSED. Flag submissions are temporarily blocked.",
        config: updated,
      });
    }

    if (action === "start") {
      if (!config.isPaused) {
        return NextResponse.json({ success: true, message: "Timer is already running.", config });
      }

      const remainingSec = config.pausedRemainingSeconds ?? Math.max(0, Math.floor((config.endTime.getTime() - now) / 1000));
      const newEndTime = new Date(now + remainingSec * 1000);

      const updated = await prisma.eventConfig.update({
        where: { id: "global" },
        data: {
          eventStarted: true,
          isPaused: false,
          endTime: newEndTime,
          pausedRemainingSeconds: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Event timer STARTED / RESUMED.",
        config: updated,
      });
    }

    if (action === "start-event") {
      const hours = Number(durationHours) || 24;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + hours * 3600 * 1000);

      const updated = await prisma.eventConfig.update({
        where: { id: "global" },
        data: {
          startTime,
          endTime,
          eventStarted: true,
          isPaused: false,
          pausedRemainingSeconds: null,
          isFrozen: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Event started with a ${hours}-hour countdown.`,
        config: updated,
      });
    }

    if (action === "reset") {
      const updated = await prisma.eventConfig.update({
        where: { id: "global" },
        data: {
          eventStarted: false,
          isPaused: true,
          pausedRemainingSeconds: 0,
          isFrozen: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Event reset. Set the duration and start it when ready.",
        config: updated,
      });
    }

    if (action === "master-reset") {
      const resetTime = new Date();

      const updated = await prisma.$transaction(async (tx) => {
        await tx.team.deleteMany({});
        await tx.announcement.deleteMany({});
        await tx.challenge.updateMany({
          data: { solveCount: 0 },
        });

        return tx.eventConfig.update({
          where: { id: "global" },
          data: {
            startTime: resetTime,
            endTime: resetTime,
            eventStarted: false,
            isPaused: true,
            pausedRemainingSeconds: 0,
            isFrozen: false,
            freezeTime: null,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Master reset complete. Teams, scores, submissions, solves, and broadcasts were cleared. Challenges were preserved.",
        config: updated,
      });
    }

    if (action === "freeze") {
      const updated = await prisma.eventConfig.update({
        where: { id: "global" },
        data: {
          isFrozen: !config.isFrozen,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Scoreboard freeze toggled: ${updated.isFrozen ? "FROZEN" : "UNFROZEN"}.`,
        config: updated,
      });
    }

    return NextResponse.json({ error: "Invalid timer action." }, { status: 400 });
  } catch (error) {
    console.error("Admin timer control error:", error);
    return NextResponse.json({ error: "Failed to update timer." }, { status: 500 });
  }
}
