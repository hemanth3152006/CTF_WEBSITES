import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getPrismaDatabaseUrl } from "../src/lib/prisma-url";

const prisma = new PrismaClient({
  datasources: { db: { url: getPrismaDatabaseUrl() } },
});
const configuredSalt = process.env.FLAG_SALT;
if (!configuredSalt) {
  throw new Error("FLAG_SALT is not configured.");
}
const SALT: string = configuredSalt;

function hashFlag(flag: string): string {
  return crypto.createHmac("sha256", SALT).update(flag.trim()).digest("hex");
}

async function main() {
  console.log("🚀 Seeding MIRAGE 2.0 Official Challenges...");

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1. Configure MIRAGE 2.0 Event
  await prisma.eventConfig.upsert({
    where: { id: "global" },
    update: {
      title: "MIRAGE 2.0 — 24H CYBER WARFARE ARENA",
      description: "Welcome to MIRAGE 2.0. A high-stakes 24-hour Capture The Flag tournament featuring real-world Binary Exploitation, Reverse Engineering, and Anti-Debugging challenges. Exploit memory corruptions, reverse custom VM bytecode, defeat ASLR, and restore Vision's Core.",
      startTime: now,
      endTime: tomorrow,
      eventStarted: false,
      isPaused: true,
      pausedRemainingSeconds: 0,
      maxTeamSize: 4,
      registrationOpen: true,
    },
    create: {
      id: "global",
      title: "MIRAGE 2.0 — 24H CYBER WARFARE ARENA",
      description: "Welcome to MIRAGE 2.0. A high-stakes 24-hour Capture The Flag tournament featuring real-world Binary Exploitation, Reverse Engineering, and Anti-Debugging challenges. Exploit memory corruptions, reverse custom VM bytecode, defeat ASLR, and restore Vision's Core.",
      startTime: now,
      endTime: tomorrow,
      eventStarted: false,
      isPaused: true,
      pausedRemainingSeconds: 0,
      maxTeamSize: 4,
      registrationOpen: true,
    },
  });

  // 2. Announcements
  await prisma.announcement.deleteMany();
  await prisma.announcement.createMany({
    data: [
      {
        title: "⚡ MIRAGE 2.0 CTF Is Officially Underway!",
        content: "All Binary Exploitation and Reverse Engineering challenges are live in the Arena. Download challenge archives directly or connect to network service ports. Official flag format: MIRAGE{...}. Brute-forcing is actively rate-limited and logged. Good hunting!",
        isPinned: true,
      },
      {
        title: "🛡️ Offline vs Remote Service Challenges",
        content: "Offline binaries (Overload Containment Field, Nova Corps Scramble, Corvus Glaive's Edge, Worldminds Archive, Scan Vision's Core) run locally on Linux or via Docker. Remote network services are available on their respective designated ports (1337, 1666, 1667, 1669, 1710, 1711).",
        isPinned: false,
      },
      {
        title: "💡 Tactical Hints Available",
        content: "If your exploit stalls, tactical hints can be unlocked directly on each challenge card in exchange for a small point deduction from your team's score.",
        isPinned: false,
      },
    ],
  });

  // 3. Official MIRAGE 2.0 Challenge Catalog
  const mirageChallenges = [
    {
      title: "Overload Containment Field",
      category: "Binary Exploitation",
      level: 1,
      difficulty: "EASY",
      points: 150,
      description: `Objective: Induce a catastrophic overload in the containment field controller to drop the barriers.

Running the binary gives a banner ("POWER STONE CONTAINMENT FIELD") and prompts: "Enter new power level calibration:". There is no visible length limit.

Execution: Standalone offline 64-bit Linux binary. Run locally or with Docker:
\`\`\`bash
chmod +x containment_field
./containment_field
\`\`\`
Type: Stack Buffer Overflow → ret2win`,
      flag: "MIRAGE{w3lc0m3_t0_th3_r3t2w1n_w0rld}",
      fileUrl: "/challenges/overload-containment-field.zip",
      fileName: "overload-containment-field.zip",
      fileSize: "3.6 KB",
      hints: [
        { content: "Inspect the binary functions with `objdump -d containment_field` or Ghidra to locate the hidden win() address.", cost: 15 },
        { content: "Find the offset between your input buffer and the saved return address (RIP). Overwrite RIP with the address of the win function.", cost: 25 },
      ],
    },
    {
      title: "Nova Corps Scramble",
      category: "Binary Exploitation",
      level: 1,
      difficulty: "EASY",
      points: 150,
      description: `Objective: Provide the correct energy requirement to generate the Master Override.

Starting from 100 Energy, there is no legitimate sequence of stated operations that increases your net Energy — it's a closed, lossy loop by design. The intended path is not to play by the stated rules, but to break them.

Execution: Standalone offline challenge.
\`\`\`bash
chmod +x nova_corps_scramble
./nova_corps_scramble
\`\`\`
Type: Integer / Arithmetic Logic Boundary Exploit`,
      flag: "MIRAGE{m4th_1s_h4rd_wh3n_b0unds_4r3_f1x3d}",
      fileUrl: "/challenges/nova-corps-scramble.zip",
      fileName: "nova-corps-scramble.zip",
      fileSize: "4.4 KB",
      hints: [
        { content: "Check how the energy calculation treats negative inputs or integer overflow boundaries.", cost: 15 },
      ],
    },
    {
      title: "Scan Vision's Core",
      category: "Reverse Engineering",
      level: 1,
      difficulty: "EASY",
      points: 150,
      description: `Objective: Vision's core has gone dark. The diagnostic interface still responds, but the authentication routine protecting the recovery channel is buried inside the damaged core.

Recover the diagnostic password and restore the core.

Execution: Standalone offline challenge:
\`\`\`bash
chmod +x vision_core
./vision_core
\`\`\`
Type: Stripped ELF Static Analysis & Constant XOR Reversal`,
      flag: "MIRAGE{V1S10N_C0R3!_R3ST0R3D#42}",
      fileUrl: "/challenges/Scan_Visions_Core_PARTICIPANT_v2.zip",
      fileName: "Scan_Visions_Core_PARTICIPANT_v2.zip",
      fileSize: "2.8 KB",
      hints: [
        { content: "Load vision_core in Ghidra or IDA Pro. Locate the string comparison loop that validates the diagnostic password.", cost: 15 },
        { content: "The check performs an XOR operation against embedded constant bytes. Invert the XOR to reconstruct the password.", cost: 25 },
      ],
    },
    {
      title: "Corvus Glaive's Edge",
      category: "Binary Exploitation",
      level: 2,
      difficulty: "MEDIUM",
      points: 250,
      description: `Objective: Execute a precise strike to override the defenses.

Corvus Glaive strikes with surgical precision. A subtle off-by-one single-byte overwrite allows you to dismantle the stack integrity protections.

Execution: Standalone offline Linux binary:
\`\`\`bash
chmod +x corvus_glaives_edge
./corvus_glaives_edge
\`\`\`
Type: Off-by-one null byte canary hijack / Stack frame corruption`,
      flag: "MIRAGE{0ff_by_0n3_null_byt3_can4ry_h1j4ck_p5}",
      fileUrl: "/challenges/corvus-glaives-edge.zip",
      fileName: "corvus-glaives-edge.zip",
      fileSize: "4.0 KB",
      hints: [
        { content: "Notice how the input function allows reading exactly 1 byte past the end of the buffer into the least significant byte of the stack canary.", cost: 25 },
      ],
    },
    {
      title: "Ebony Maw's Persuasion Protocol",
      category: "Binary Exploitation",
      level: 2,
      difficulty: "MEDIUM",
      points: 250,
      description: `Objective: The vault listens to exactly one message. Ebony Maw doesn't need brute force. He only needs the right words. Convince the security core to hand over control.

Technique: Format-string arbitrary write
Remote Service Port: TCP 1337

Connect via:
\`\`\`bash
nc <CTF-IP> 1337
\`\`\`
Or run locally with Docker:
\`\`\`bash
docker build -t ebony-maw .
docker run -p 1337:1337 ebony-maw
\`\`\``,
      flag: "MIRAGE{ebony_maw_format_string_persuasion}",
      fileUrl: "/challenges/ebony-maw-challenge.zip",
      fileName: "ebony-maw-challenge.zip",
      fileSize: "5.4 KB",
      hints: [
        { content: "Your input is passed directly to printf without a format specifier (%s, %x, %n).", cost: 25 },
        { content: "Use the `%n` or `%hn` specifier to overwrite the target authorization variable in memory with the required value.", cost: 40 },
      ],
    },
    {
      title: "Nova Prime's Last Stand",
      category: "Binary Exploitation",
      level: 2,
      difficulty: "MEDIUM",
      points: 275,
      description: `Objective: Find the object lifecycle vulnerability in the Nova Prime command protocol.

The binary presents a menu of operations across command slots: Register, Retire, Reforge, Execute.

Technique: Use-After-Free (UAF) → function-pointer hijack
Remote Service Port: TCP 1669

Connect via:
\`\`\`bash
nc <CTF-IP> 1669
\`\`\`
Built with debug symbols included.`,
      flag: "MIRAGE{n0va_pr1m3_st4nds_wh3n_th3_v4ult_coll4ps}",
      fileUrl: "/challenges/Nova_Primes_Last_Stand_PARTICIPANT.zip",
      fileName: "Nova_Primes_Last_Stand_PARTICIPANT.zip",
      fileSize: "8.6 KB",
      hints: [
        { content: "Retire frees an allocated chunk, but check whether the pointer in the command slot is set to NULL.", cost: 25 },
        { content: "Allocate another structure of matching size into the freed slot to hijack the function pointer called during Execute.", cost: 40 },
      ],
    },
    {
      title: "The Final Rip",
      category: "Reverse Engineering",
      level: 2,
      difficulty: "MEDIUM",
      points: 300,
      description: `Objective: Extract the Stone before the timeline shatters.

The terminal warns: "EXTRACTION LOCK: ENGAGED - DIAGNOSTIC NOTE: HE DOES NOT WAIT." Anti-debugging routines and timing constraints actively monitor the process.

Technique: Reverse Engineering / Anti-Debugging / Source Review
Remote Service Port: TCP 1666

Connect via:
\`\`\`bash
nc <CTF-IP> 1666
\`\`\`
Full challenge source (final_rip.c) and Docker deployment included.`,
      flag: "MIRAGE{th3_f1nal_r1p_w4s_st0pp3d_1n_t1m3!}",
      fileUrl: "/challenges/The_Final_Rip_DEPLOYMENT.zip",
      fileName: "The_Final_Rip_DEPLOYMENT.zip",
      fileSize: "7.7 KB",
      hints: [
        { content: "Examine final_rip.c directly. The binary measures elapsed CPU time and checks for active ptrace attachments.", cost: 30 },
        { content: "Script the sequence of stabilization commands in Python with pwntools/socket to beat the strict timeout window.", cost: 45 },
      ],
    },
    {
      title: "Worldminds Archive",
      category: "Binary Exploitation",
      level: 3,
      difficulty: "HARD",
      points: 350,
      description: `Objective: Breach the Worldmind's archives by bypassing advanced memory randomization (ASLR).

This challenge ships with its own Ubuntu 22.04 libc.so.6 (glibc 2.35).

Execution:
\`\`\`bash
docker run --rm -it --platform linux/amd64 -v "$PWD":/ch -w /ch ubuntu:22.04 \
  bash -c "chmod +x worldmind_archive && LD_LIBRARY_PATH=/ch ./worldmind_archive"
\`\`\`
Technique: Stack Buffer Overflow + GOT Leak → ret2libc ROP chain`,
      flag: "MIRAGE{w0rldm1nd_r0p_ch41n_4slr_byp4ss}",
      fileUrl: "/challenges/worldminds-archive.zip",
      fileName: "worldminds-archive.zip",
      fileSize: "986 KB",
      hints: [
        { content: "Use the initial output to leak a known GOT table address (e.g. puts/read) to compute the libc base address.", cost: 35 },
        { content: "Construct a ROP chain using gadgets from the provided libc to call system('/bin/sh') or dump the flag.", cost: 50 },
      ],
    },
    {
      title: "Cull Obsidian's Brute Force",
      category: "Binary Exploitation",
      level: 3,
      difficulty: "HARD",
      points: 400,
      description: `Objective: Penetrate Cull Obsidian's fortified vault.

This challenge implements a full modern mitigation chain:
1. Leak the stack canary and PIE return address through the telemetry interface.
2. Recover the PIE base address.
3. Overflow the emergency-override buffer while preserving the canary value.
4. Align the stack (ret gadget) and return to win().

Remote Service Port: TCP 1667
Connect via:
\`\`\`bash
nc <CTF-IP> 1667
\`\`\``,
      flag: "MIRAGE{cull_obsidian_brute_force_breaks_the_vault}",
      fileUrl: "/challenges/MIRAGE_Binary_Ch7_Cull_Obsidian_FIXED_SOLVABLE.zip",
      fileName: "MIRAGE_Binary_Ch7_Cull_Obsidian_FIXED_SOLVABLE.zip",
      fileSize: "2.4 KB",
      hints: [
        { content: "Telemetry options print uninitialized stack memory. Look for the 8-byte canary (ends in 00) and code pointer.", cost: 40 },
        { content: "Remember stack alignment on x86-64: ensure RSP is 16-byte aligned before calling win() by inserting an extra `ret` gadget.", cost: 50 },
      ],
    },
    {
      title: "Shuri's Last Attempt",
      category: "Reverse Engineering",
      level: 3,
      difficulty: "HARD",
      points: 450,
      description: `Objective: "The core logic is buried behind its own execution layer."

The program is a custom virtual machine executing an embedded bytecode stream. Tracing under a debugger triggers a deceptive decoy trap!

Remote Service Port: TCP 1710
Connect via:
\`\`\`bash
nc <CTF-IP> 1710
\`\`\`
Type: Custom Bytecode VM Reverse Engineering`,
      flag: "MIRAGE{shur1_f1n4l_4tt3mpt_br0ke_th3_vm!}",
      fileUrl: "/challenges/Shuris_Last_Attempt.zip",
      fileName: "Shuris_Last_Attempt.zip",
      fileSize: "5.6 KB",
      hints: [
        { content: "Do not trust flags found via debugger tracing; they are decoys. Reverse the VM interpreter statically.", cost: 45 },
        { content: "Each position performs an XOR -> ADD -> compare rolling checksum. Invert the VM math algebraically in Python.", cost: 60 },
      ],
    },
    {
      title: "The Mind Stone",
      category: "Reverse Engineering",
      level: 3,
      difficulty: "HARD",
      points: 450,
      description: `Objective: Vision Core state: "SELF-MODIFYING CORE."

The binary dynamically decrypts and compiles its own verification instructions in memory at runtime. It is statically linked with stripped symbols.

Remote Service Port: TCP 1711
Connect via:
\`\`\`bash
nc <CTF-IP> 1711
\`\`\`
Type: JIT-Decoded Validator / Self-Modifying Code Reversal`,
      flag: "MIRAGE{v1s10n_f0und_th3_m1nd_st0n3!_42}",
      fileUrl: "/challenges/The_Mind_Stone_DEPLOYMENT.zip",
      fileName: "The_Mind_Stone_DEPLOYMENT.zip",
      fileSize: "304 KB",
      hints: [
        { content: "The decode routine decrypts 17 small blocks into an executable page, one block per input character.", cost: 45 },
        { content: "Each character is validated by: `input[i] = X_i XOR ((Z_i - Y_i) & 0xFF)`. Extract the constants from the decoder to solve offline.", cost: 60 },
      ],
    },
    {
      title: "Corrupted by Thanos's Attack",
      category: "Digital Forensics",
      level: 4,
      difficulty: "INSANE",
      points: 500,
      description: `Objective: The research lab was breached and its raw firmware dump was recovered in a damaged state. Several regions survived, but the corruption left misleading decoy traces throughout the image.

Warning: Some strings look like flags. DO NOT trust a flag merely because \`strings\` finds it.

Reconstruct the surviving recovery data, identify internal sections, and recover what Thanos failed to erase.

Tools: file, xxd, strings, python3, binwalk, hex editors.`,
      flag: "MIRAGE{29326ml64lg2tjf8cz2k}",
      fileUrl: "/challenges/Corrupted_by_Thanos_Attack.zip",
      fileName: "Corrupted_by_Thanos_Attack.zip",
      fileSize: "2.9 KB",
      hints: [
        { content: "Check section headers and CRC32 checksums within the raw firmware image.", cost: 50 },
        { content: "Look for high-entropy chunks that correspond to the genuine recovery partition.", cost: 75 },
      ],
    },
  ];

  // 4. Clean out old test challenges and insert official MIRAGE 2.0 set
  await prisma.unlockedHint.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.solve.deleteMany();
  await prisma.hint.deleteMany();
  await prisma.challenge.deleteMany();

  for (const c of mirageChallenges) {
    await prisma.challenge.create({
      data: {
        title: c.title,
        category: c.category,
        level: c.level,
        difficulty: c.difficulty,
        points: c.points,
        description: c.description,
        flagHash: hashFlag(c.flag),
        flagFormat: "MIRAGE{...}",
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        fileSize: c.fileSize,
        hints: {
          create: c.hints.map((h) => ({
            content: h.content,
            cost: h.cost,
          })),
        },
      },
    });
  }

  console.log(`✅ Loaded ${mirageChallenges.length} official MIRAGE 2.0 challenges into the database.`);

  // 5. Ensure Admin User Exists
  const adminPasswordHash = await bcrypt.hash("AdminPassword2026!", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      username: "admin",
      email: "admin@collegectf.edu",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin user created/verified (admin / AdminPassword2026!)");

  // 6. Ensure Demo Team Exists
  const demoTeam = await prisma.team.upsert({
    where: { name: "CyberKnights" },
    update: {},
    create: {
      name: "CyberKnights",
      joinCode: "KNIGHT-2026",
      affiliation: "Computer Science Dept",
      points: 0,
    },
  });

  const participantPasswordHash = await bcrypt.hash("HackerPassword123!", 10);
  await prisma.user.upsert({
    where: { username: "hacker1" },
    update: {
      teamId: demoTeam.id,
    },
    create: {
      username: "hacker1",
      email: "hacker1@collegectf.edu",
      passwordHash: participantPasswordHash,
      role: Role.USER,
      teamId: demoTeam.id,
    },
  });
  console.log("✅ Demo team 'CyberKnights' created (hacker1 / HackerPassword123!)");

  console.log("🎉 MIRAGE 2.0 Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
