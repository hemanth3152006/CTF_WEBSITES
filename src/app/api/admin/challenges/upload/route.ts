import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Files must be smaller than 50 MB." }, { status: 413 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
    const challengeDirectory = path.join(process.cwd(), "public", "challenges");
    await mkdir(challengeDirectory, { recursive: true });
    await writeFile(path.join(challengeDirectory, storedName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: `/challenges/${storedName}`,
    });
  } catch (error) {
    console.error("Challenge file upload error:", error);
    return NextResponse.json({ error: "Failed to upload challenge file." }, { status: 500 });
  }
}
