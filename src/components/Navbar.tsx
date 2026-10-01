"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Flag, Trophy, Users, BookOpen, LogOut, Terminal, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import AnnouncementStrip from "./AnnouncementStrip";

interface UserSession {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
    points: number;
    joinCode: string;
  } | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  isAdminOnly?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (loading || !user) {
    return null;
  }

  // Distinct navigation paths: Admin Portal vs Participant Portal
  const isAdmin = user?.role === "ADMIN";

  const navItems: NavItem[] = isAdmin
    ? [
        { name: "Command Center", href: "/admin", icon: Shield, isAdminOnly: true },
        { name: "Arena Preview", href: "/arena", icon: Eye },
        { name: "Scoreboard", href: "/scoreboard", icon: Trophy },
        { name: "Rules & Guidelines", href: "/rules", icon: BookOpen },
      ]
    : [
        { name: "Arena", href: "/arena", icon: Flag },
        { name: "Scoreboard", href: "/scoreboard", icon: Trophy },
        { name: "My Team", href: "/teams", icon: Users },
        { name: "Rules & FAQ", href: "/rules", icon: BookOpen },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2.5 group">
          <div
            className={`p-2 rounded-lg border transition shadow-lg ${
              isAdmin
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            }`}
          >
            {isAdmin ? <Shield className="w-5 h-5" /> : <Terminal className="w-5 h-5 group-hover:scale-105 transition" />}
          </div>
          <div>
            <span className="font-mono text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              CYFOX<span className={isAdmin ? "text-rose-400" : "text-emerald-400"}>2.0</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                  isAdmin
                    ? "bg-rose-950/80 text-rose-300 border-rose-800/50 font-bold"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {isAdmin ? "ORGANIZER PANEL" : "24H CTF"}
              </span>
            </span>
          </div>
        </Link>

        {/* Center: Countdown Timer */}
        <div className="hidden md:flex items-center">
          <CountdownTimer />
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isSpecialAdmin = item.isAdminOnly;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition ${
                  isActive
                    ? isSpecialAdmin
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)] font-bold"
                      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] font-bold"
                    : isSpecialAdmin
                    ? "text-rose-400 hover:bg-rose-950/30 border border-rose-900/40 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth status & User badge */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-slate-800/50 animate-pulse rounded" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              {/* If Admin: show Admin Status Badge */}
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span>ORGANIZER</span>
                  <span className="text-[10px] text-rose-400/80 font-normal">(@{user.username})</span>
                </Link>
              ) : (
                /* If Participant: show Team Badge */
                user.team && (
                  <Link
                    href="/teams"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition text-xs font-mono text-slate-300"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-white">{user.team.name}</span>
                    <span className="text-emerald-400 font-bold ml-1">{user.team.points} pts</span>
                  </Link>
                )
              )}

              <div className="flex items-center gap-2 pl-2">
                {!isAdmin && (
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    @{user.username}
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition"
              >
                Register Team
              </Link>
            </div>
          )}
        </div>
      </div>
      <AnnouncementStrip />
    </header>
  );
}
