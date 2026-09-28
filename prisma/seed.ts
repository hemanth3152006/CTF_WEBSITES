import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();
const SALT = process.env.FLAG_SALT || "ctf-flag-pepper-secret-2026-security";

function hashFlag(flag: string): string {
  return crypto.createHmac("sha256", SALT).update(flag.trim()).digest("hex");
}

async function main() {
  console.log("🌱 Starting CTF database seeding...");

  // 1. Create or reset Event Config (24 hours duration)
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.eventConfig.upsert({
    where: { id: "global" },
    update: {
      title: "COLLEGE CYBER-STRIKE 24HR CTF 2026",
      description: "Battle against top college teams in an intense 24-hour cybersecurity capture-the-flag marathon. Exploit, decrypt, reverse-engineer, and conquer the leaderboard!",
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
      title: "COLLEGE CYBER-STRIKE 24HR CTF 2026",
      description: "Battle against top college teams in an intense 24-hour cybersecurity capture-the-flag marathon. Exploit, decrypt, reverse-engineer, and conquer the leaderboard!",
      startTime: now,
      endTime: tomorrow,
      eventStarted: false,
      isPaused: true,
      pausedRemainingSeconds: 0,
      maxTeamSize: 4,
      registrationOpen: true,
    },
  });

  // 2. Create Default Admin
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
  console.log("✅ Admin user created (admin / AdminPassword2026!)");

  // 3. Create Sample Announcement
  await prisma.announcement.createMany({
    data: [
      {
        title: "🏁 CTF Officially Commenced!",
        content: "The 24-hour countdown has begun. Flag format is strictly CTF{...}. Brute-forcing will result in automatic rate-limiting and disqualification. Good luck teams!",
        isPinned: true,
      },
      {
        title: "💡 Hint Policy",
        content: "Hints are available on select challenges but will deduct points from your team's total score. Choose wisely!",
        isPinned: false,
      },
    ],
  });

  // 4. Create Initial Challenges across Categories and Levels
  const challengesData = [
    // Web Exploitation
    {
      title: "Inspect The Matrix",
      category: "Web",
      level: 1,
      difficulty: "EASY",
      points: 100,
      description: "A rogue agent left a secret credential hidden right in the client-side portal source. Can you inspect the elements and retrieve it?",
      flag: "CTF{1nsp3ct_3l3m3nt_1s_p0w3rful}",
      hints: [
        { content: "Open your browser Developer Tools (F12) and inspect the HTML comment tags.", cost: 10 },
      ],
    },
    {
      title: "Cookie Monster's Session",
      category: "Web",
      level: 2,
      difficulty: "MEDIUM",
      points: 250,
      description: "The admin dashboard checks your role via a client cookie named `user_role`. By default it is set to `guest`. Can you elevate your privileges?",
      flag: "CTF{c00k13_m4n1pul4t10n_34sy}",
      hints: [
        { content: "Try editing cookies in Application / Storage tab of DevTools to user_role=admin.", cost: 25 },
      ],
    },
    {
      title: "SQL Injection 101",
      category: "Web",
      level: 3,
      difficulty: "HARD",
      points: 400,
      description: "A vulnerable login endpoint constructs raw SQL queries: `SELECT * FROM users WHERE username = '...' AND password = '...'`. Bypass the password check!",
      flag: "CTF{sql1_byp4ss_auth_m4st3r}",
      hints: [
        { content: "Classic payload: ' OR '1'='1' --", cost: 50 },
      ],
    },

    // Cryptography
    {
      title: "Caesar's Whispers",
      category: "Crypto",
      level: 1,
      difficulty: "EASY",
      points: 100,
      description: "Julius left a ciphered directive for his legions: `FWH{fdhvdu_flskhu_vkliw_wkuhh}`. The shift value is 3.",
      flag: "CTF{caesar_cipher_shift_three}",
      hints: [
        { content: "Each letter is shifted 3 positions backward in the Latin alphabet.", cost: 10 },
      ],
    },
    {
      title: "Base64 Inception",
      category: "Crypto",
      level: 2,
      difficulty: "MEDIUM",
      points: 200,
      description: "We intercepted a multi-encoded stream: `UTBoU1UwUkJRVUZVTlZOSlFsUkJRVUZVUVZOVFVFVT0=`. Decode each layer to find the secret.",
      flag: "CTF{b4s364_mult1_l4y3r_d3c0d3}",
      hints: [
        { content: "This is encoded multiple times in Base64.", cost: 20 },
      ],
    },
    {
      title: "XOR Encryption Mystery",
      category: "Crypto",
      level: 3,
      difficulty: "HARD",
      points: 350,
      description: "The ciphertext was created with single-byte XOR against an unknown key. The output hex is: `100715082b3a210c3b313d332b3134373d322b7e`. Find the key and recover the plaintext flag.",
      flag: "CTF{x0r_s1ngl3_byt3_cr4ck}",
      hints: [
        { content: "The flag starts with 'CTF{'. Use the known plaintext to deduce the XOR byte key.", cost: 40 },
      ],
    },

    // Forensics
    {
      title: "Hidden in Plain Sight",
      category: "Forensics",
      level: 1,
      difficulty: "EASY",
      points: 100,
      description: "A suspicious PNG image was intercepted from the campus network. Strings analysis reveals metadata embedded in the file trailer.",
      flag: "CTF{str1ngs_c0mm4nd_f0r_th3_w1n}",
      hints: [
        { content: "Use the `strings` command or open the file in a hex editor like HxD.", cost: 10 },
      ],
    },
    {
      title: "Corrupted Header Recovery",
      category: "Forensics",
      level: 2,
      difficulty: "MEDIUM",
      points: 250,
      description: "The file was uploaded with damaged magic bytes. Repair the 8-byte PNG signature `89 50 4E 47 0D 0A 1A 0A` to restore the image and read the flag.",
      flag: "CTF{m4g1c_byt3s_r3st0r3d}",
      hints: [
        { content: "Check the first 8 bytes of the file in a hex editor.", cost: 25 },
      ],
    },

    // Reverse Engineering
    {
      title: "Decompile the Binary",
      category: "Reverse",
      level: 1,
      difficulty: "EASY",
      points: 150,
      description: "A compiled C program checks an inputted serial key. Run Ghidra or IDA Pro to find the hardcoded comparison string.",
      flag: "CTF{gh1dr4_d3c0mp1l3_s3cr3t}",
      hints: [
        { content: "Look in the `main` or `validate_key` function decompilation.", cost: 15 },
      ],
    },
    {
      title: "Anti-Debugging Bypass",
      category: "Reverse",
      level: 2,
      difficulty: "HARD",
      points: 400,
      description: "The executable calls `IsDebuggerPresent()` and terminates if a debugger is attached. Patch the jump instruction or hook the API to reach the victory routine.",
      flag: "CTF{p4tch_th3_jmp_byp4ss_dbg}",
      hints: [
        { content: "Change JZ (74) to JNZ (75) or NOP out the conditional branch.", cost: 40 },
      ],
    },

    // OSINT & Misc
    {
      title: "The Ghost in the Git Log",
      category: "OSINT",
      level: 1,
      difficulty: "EASY",
      points: 100,
      description: "A developer accidentally committed the secret production flag, then made another commit deleting it. Can you check git history (`git log -p`) to recover it?",
      flag: "CTF{g1t_c0mm1t_h1st0ry_n3v3r_l13s}",
      hints: [
        { content: "Run `git log -p` or `git reflog` to see deleted diffs.", cost: 10 },
      ],
    },
  ];

  for (const c of challengesData) {
    const existing = await prisma.challenge.findFirst({
      where: { title: c.title },
    });

    if (!existing) {
      await prisma.challenge.create({
        data: {
          title: c.title,
          category: c.category,
          level: c.level,
          difficulty: c.difficulty,
          points: c.points,
          description: c.description,
          flagHash: hashFlag(c.flag),
          flagFormat: "CTF{...}",
          hints: {
            create: c.hints.map((h) => ({
              content: h.content,
              cost: h.cost,
            })),
          },
        },
      });
    }
  }

  console.log(`✅ Loaded ${challengesData.length} starter challenges across Web, Crypto, Forensics, Reverse & OSINT.`);

  // 5. Create a Demo Team for immediate testing
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

  console.log("✅ Demo team 'CyberKnights' created with join code 'KNIGHT-2026' and member 'hacker1' (pass: HackerPassword123!)");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
