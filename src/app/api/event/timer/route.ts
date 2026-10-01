import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.eventConfig.findUnique({
      where: { id: "global" },
    });

    if (!config) {
      return NextResponse.json({
        title: "24-Hour CTF",
        isPaused: false,
        eventStarted: false,
        remainingSeconds: 0,
        isEnded: false,
        isFrozen: false,
      });
    }

    const now = Date.now();
    let remainingSeconds = 0;
    let isEnded = false;

    if (!config.eventStarted) {
      remainingSeconds = 0;
      isEnded = config.endTime.getTime() <= now;
    } else if (config.isPaused) {
      remainingSeconds = config.pausedRemainingSeconds ?? 0;
      isEnded = remainingSeconds <= 0;
    } else {
      const diffMs = config.endTime.getTime() - now;
      if (diffMs <= 0) {
        remainingSeconds = 0;
        isEnded = true;
      } else {
        remainingSeconds = Math.floor(diffMs / 1000);
      }
    }

    return NextResponse.json({
      title: config.title,
      startTime: config.startTime,
      endTime: config.endTime,
      isPaused: config.isPaused,
      eventStarted: config.eventStarted,
      remainingSeconds,
      isEnded,
      isFrozen: config.isFrozen,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Timer fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch event timer." }, { status: 500 });
  }
}
