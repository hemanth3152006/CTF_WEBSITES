import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hashFlag } from "@/lib/flags";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      category,
      level,
      difficulty,
      points,
      description,
      flag,
      hints,
      fileUrl,
      fileName,
    } = body;

    if (!title || !category || !points || !flag) {
      return NextResponse.json(
        { error: "Title, category, points, and flag are required." },
        { status: 400 }
      );
    }

    const flagHash = hashFlag(flag);

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        level: Number(level) || 1,
        difficulty: difficulty || "MEDIUM",
        points: Number(points),
        description: description || "",
        flagHash,
        flagFormat: "CTF{...}",
        fileUrl: fileUrl?.trim() || null,
        fileName: fileName?.trim() || null,
        hints: hints && Array.isArray(hints)
          ? {
              create: hints.map((h: { content: string; cost?: number }) => ({
                content: h.content,
                cost: Number(h.cost) || 0,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, challenge });
  } catch (error) {
    console.error("Admin create challenge error:", error);
    return NextResponse.json({ error: "Failed to create challenge." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Challenge ID is required." }, { status: 400 });
    }

    await prisma.challenge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Challenge deleted." });
  } catch (error) {
    console.error("Admin delete challenge error:", error);
    return NextResponse.json({ error: "Failed to delete challenge." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { id, isVisible, action, pauseMinutes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Challenge ID is required." }, { status: 400 });
    }

    if (typeof isVisible === "boolean") {
      const updated = await prisma.challenge.update({
        where: { id },
        data: { isVisible },
      });

      return NextResponse.json({
        success: true,
        message: `Challenge "${updated.title}" is now ${isVisible ? "VISIBLE" : "HIDDEN"}.`,
        challenge: updated,
      });
    }

    if (action !== "pause" && action !== "resume") {
      return NextResponse.json({ error: "Provide a visibility value or pause action." }, { status: 400 });
    }

    const pausedUntil = action === "pause"
      ? new Date(Date.now() + Math.max(1, Number(pauseMinutes) || 30) * 60 * 1000)
      : null;
    const updated = await prisma.challenge.update({
      where: { id },
      data: {
        isPaused: action === "pause",
        pausedUntil,
      },
    });

    return NextResponse.json({
      success: true,
      message: action === "pause"
        ? `Challenge "${updated.title}" is paused until ${pausedUntil?.toLocaleTimeString()}.`
        : `Challenge "${updated.title}" has resumed.`,
      challenge: updated,
    });
  } catch (error) {
    console.error("Admin toggle challenge visibility error:", error);
    return NextResponse.json({ error: "Failed to update challenge visibility." }, { status: 500 });
  }
}
