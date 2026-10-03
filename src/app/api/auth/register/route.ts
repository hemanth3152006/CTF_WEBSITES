import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, teamAction, teamName, joinCode, affiliation } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const eventConfig = await prisma.eventConfig.findUnique({
      where: { id: "global" },
      select: { eventStarted: true },
    });

    if (!eventConfig?.eventStarted) {
      return NextResponse.json(
        { error: "Registration is locked until the administrator starts the event." },
        { status: 403 }
      );
    }

    // Check existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email is already registered." },
        { status: 409 }
      );
    }

    let teamId: string | null = null;

    // Handle Team creation or joining
    if (teamAction === "create" && teamName) {
      const existingTeam = await prisma.team.findUnique({
        where: { name: teamName.trim() },
      });
      if (existingTeam) {
        return NextResponse.json(
          { error: "A team with that name already exists." },
          { status: 409 }
        );
      }

      // Generate random 8-char uppercase join code
      const generatedCode = `${teamName.trim().slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newTeam = await prisma.team.create({
        data: {
          name: teamName.trim(),
          joinCode: generatedCode,
          affiliation: affiliation?.trim() || null,
        },
      });
      teamId = newTeam.id;
    } else if (teamAction === "join" && joinCode) {
      const targetTeam = await prisma.team.findUnique({
        where: { joinCode: joinCode.trim().toUpperCase() },
        include: { members: true },
      });

      if (!targetTeam) {
        return NextResponse.json(
          { error: "Invalid team join code." },
          { status: 404 }
        );
      }

      if (targetTeam.members.length >= 4) {
        return NextResponse.json(
          { error: "This team has reached the maximum capacity (4 members)." },
          { status: 400 }
        );
      }

      teamId = targetTeam.id;
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "USER",
        teamId,
      },
    });

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      teamId: user.teamId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
    });

    response.cookies.set("ctf_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 48, // 48 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
