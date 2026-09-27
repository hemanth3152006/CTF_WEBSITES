import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("Announcements error:", error);
    return NextResponse.json({ error: "Failed to load announcements." }, { status: 500 });
  }
}
