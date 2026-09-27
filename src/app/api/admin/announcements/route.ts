import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { title, content, isPinned } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Post announcement error:", error);
    return NextResponse.json({ error: "Failed to broadcast announcement." }, { status: 500 });
  }
}
