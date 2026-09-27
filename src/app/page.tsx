"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import {
  Terminal,
  Shield,
  Zap,
  Trophy,
  ArrowRight,
  Flame,
  Lock,
  Globe,
  Radio,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    challenges: 11,
    teams: 0,
    firstBloods: 0,
    topScore: 0,
  });

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.announcements) setAnnouncements(data.announcements);
      })
      .catch(() => {});

    fetch("/api/scoreboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.scoreboard) {
          const list = data.scoreboard;
          const totalFirstBloods = list.reduce((acc: number, t: any) => acc + (t.firstBloods || 0), 0);
          const highestScore = list.length > 0 ? list[0].points : 0;
          setStats((prev) => ({
            ...prev,
            teams: list.length,
            firstBloods: totalFirstBloods,
            topScore: highestScore,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80">
          {/* Subtle cyber background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>COLLEGE 24-HOUR CTF IS LIVE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
              DEFEND. EXPLOIT. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                DOMINATE THE MATRIX.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 font-mono">
              Welcome to the 24-hour inter-college cybersecurity capture-the-flag marathon.
              Solve multi-level challenges, earn First Blood bonuses, and claim the championship.
            </p>

            {/* Countdown Banner */}
            <div className="flex justify-center mb-10">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center gap-4">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  Event Countdown:
                </span>
                <CountdownTimer />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/arena"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.35)] transition flex items-center justify-center gap-2 group"
              >
                <span>ENTER ARENA</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-mono font-medium text-sm tracking-wide transition flex items-center justify-center gap-2"
              >
                <span>REGISTER TEAM</span>
              </Link>
              <Link
                href="/scoreboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/50 font-mono font-medium text-sm tracking-wide transition flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>LEADERBOARD</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Live Metrics Row */}
        <section className="py-8 bg-slate-900/40 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-3xl font-extrabold font-mono text-emerald-400 mb-1">
                  {stats.challenges}
                </div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Challenges
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-3xl font-extrabold font-mono text-cyan-400 mb-1">
                  {stats.teams}
                </div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Active Teams
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-3xl font-extrabold font-mono text-rose-400 mb-1 flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-rose-400" />
                  <span>{stats.firstBloods}</span>
                </div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  First Bloods
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-3xl font-extrabold font-mono text-amber-400 mb-1">
                  {stats.topScore}
                </div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Top Score
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements & Track Categories */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Challenge Categories */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span>COMPETITION TRACKS</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h4 className="font-mono font-bold text-white">Web Exploitation</h4>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    SQL injection, session hijacking, cookie manipulation, and API bypasses.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="font-mono font-bold text-white">Cryptography</h4>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    Classic ciphers, multi-layer base decoding, XOR cracking, and modern key analysis.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-mono font-bold text-white">Digital Forensics</h4>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    Image steganography, magic byte repair, memory dumps, and PCAP analysis.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="font-mono font-bold text-white">Reverse Engineering</h4>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    Binary analysis, decompilation in Ghidra, and bypassing anti-debugging checks.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Live Announcement Feed */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>COMMAND BROADCASTS</span>
              </h3>

              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 font-mono text-xs text-slate-500">
                    No active broadcasts. All systems nominal.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border font-mono text-xs ${
                        a.isPinned
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-900/60 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="font-bold text-sm mb-1 text-white flex items-center justify-between">
                        <span>{a.title}</span>
                        {a.isPinned && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            PINNED
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-slate-400">{a.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center font-mono text-xs text-slate-500">
        <div>CYBER-STRIKE 2026 // College Capture The Flag Platform</div>
        <div className="mt-1 text-slate-600">Built with Next.js, Prisma & TypeScript</div>
      </footer>
    </div>
  );
}
