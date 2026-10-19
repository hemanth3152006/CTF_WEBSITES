import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error("Admin announcements list error:", error);
    return NextResponse.json({ error: "Failed to load announcements." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { title, content, isPinned } = await req.json();
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    if (!trimmedTitle || !trimmedContent) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: trimmedTitle,
        content: trimmedContent,
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Post announcement error:", error);
    return NextResponse.json({ error: "Failed to broadcast announcement." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { id, isPinned } = await req.json();
    if (typeof id !== "string" || typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "Announcement id and pin state are required." }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { isPinned },
    });

    return NextResponse.json({
      success: true,
      message: isPinned ? "Announcement pinned." : "Announcement unpinned.",
      announcement,
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    return NextResponse.json({ error: "Failed to update announcement." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Announcement id is required." }, { status: 400 });
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Announcement deleted." });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: "Failed to delete announcement." }, { status: 500 });
  }
}
