"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Flag,
  Medal,
  RefreshCw,
  Snowflake,
  Users,
} from "lucide-react";

interface Solve {
  challengeId: string;
  challengeTitle: string;
  category: string;
  points: number;
  isFirstBlood: boolean;
  solvedAt: string;
}

interface ScoreboardTeam {
  rank: number;
  teamId: string;
  teamName: string;
  affiliation?: string | null;
  points: number;
  solveCount: number;
  firstBloods: number;
  lastSubmissionTime?: string | null;
  members: string[];
  solves: Solve[];
}

interface EventData {
  title: string;
  isFrozen: boolean;
  endTime?: string;
  startTime?: string;
}

interface Category {
  name: string;
  solves: number;
  color: string;
}

const categoryColors = ["#39ff14", "#00f0ff", "#ff20f0", "#fff500", "#ffad38", "#9b7cff"];

export default function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreboardTeam[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [challengeCount, setChallengeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [range, setRange] = useState("24 Hours");

  const fetchScoreboard = () => {
    fetch("/api/scoreboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.scoreboard) {
          setScoreboard(data.scoreboard);
          setEventData(data.event);
          setChallengeCount(data.challengeCount || 0);
          setLastUpdated(new Date());
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScoreboard();
    if (!autoRefresh) return;
    const interval = setInterval(fetchScoreboard, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const categories = useMemo<Category[]>(() => {
    const counts = new Map<string, number>();
    scoreboard.forEach((team) =>
      team.solves.forEach((solve) => counts.set(solve.category, (counts.get(solve.category) || 0) + 1))
    );
    const values = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = values[0]?.[1] || 1;
    return values.map(([name, solves], index) => ({
      name,
      solves,
      color: categoryColors[index % categoryColors.length],
    })).map((category) => ({ ...category, solves: category.solves, max } as Category & { max: number }));
  }, [scoreboard]);

  const totalUsers = useMemo(
    () => new Set(scoreboard.flatMap((team) => team.members)).size,
    [scoreboard]
  );
  const maxPoints = scoreboard[0]?.points || 1;
  const tracePoints = scoreboard.slice(0, 10).map((team, index) => {
    const x = 20 + (index * 960) / Math.max(1, Math.min(scoreboard.length, 10) - 1);
    const y = 150 - (team.points / maxPoints) * 115;
    return `${x},${y}`;
  });

  return (
    <div className="min-h-screen bg-[#101827] text-slate-100 font-mono">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-[#39ff14] sm:text-3xl">LEADERBOARD</h1>
            <p className="mt-2 text-xs tracking-wide text-slate-500">
              Real-time competitive metrics evaluation context
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {["All Time", "24 Hours", "7 Days", "30 Days"].map((item) => (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`px-4 py-2 transition ${range === item ? "bg-[#39ff14] font-bold text-slate-950" : "bg-[#080b13] text-slate-500 hover:text-white"}`}
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="rounded-full border border-slate-800 bg-[#080b13] p-2 text-slate-400 hover:text-white"
              title={autoRefresh ? "Pause updates" : "Resume updates"}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {eventData?.isFrozen && (
          <div className="mt-5 flex items-center gap-2 border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs text-cyan-300">
            <Snowflake className="h-4 w-4" /> SCOREBOARD FROZEN BY EVENT ORGANIZERS
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard label="TOTAL USER'S" value={totalUsers} icon={<Users />} color="lime" />
          <MetricCard label="TOTAL CHALLENGES" value={challengeCount} icon={<Flag />} color="cyan" />
          <MetricCard label="TOTAL TEAM'S" value={scoreboard.length} icon={<Users />} color="pink" />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="border border-slate-800 bg-[#090c14] p-5">
            <PanelTitle>TOP SOLVED CATEGORIES</PanelTitle>
            <div className="mt-5 space-y-4">
              {loading ? <div className="h-32 animate-pulse bg-slate-800/40" /> : categories.length === 0 ? (
                <p className="py-8 text-xs text-slate-600">Solve data will appear here during the event.</p>
              ) : categories.map((category) => {
                const max = (category as Category & { max: number }).max;
                return (
                  <div key={category.name}>
                    <div className="mb-1.5 flex justify-between text-[11px]">
                      <span className="text-slate-300">{category.name}</span>
                      <span style={{ color: category.color }}>{category.solves} Solves</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#171d2b]">
                      <div className="h-full rounded-full" style={{ width: `${(category.solves / max) * 100}%`, backgroundColor: category.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-slate-800 bg-[#090c14] p-5">
            <div className="flex items-center justify-between">
              <PanelTitle>LIVE SERVER TELEMETRY</PanelTitle>
              <span className="rounded-full bg-green-950/80 px-3 py-1 text-[10px] text-[#39ff14]">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> Live
              </span>
            </div>
            <div className="mt-8 flex items-center justify-center gap-10 sm:gap-16">
              <div className="relative h-28 w-28 rounded-full" style={{ background: "conic-gradient(#00f0ff 0 20%, #151c2b 20% 100%)" }}>
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#090c14]">
                  <strong className="text-base text-white">20%</strong>
                  <span className="mt-1 text-[8px] text-slate-600">CPU/RAM</span>
                </div>
              </div>
              <div>
                <div className="border border-slate-800 bg-black/40 px-4 py-3">
                  <span className="block text-[10px] text-slate-400">LIVE VISITORS</span>
                  <strong className="mt-2 block text-xl text-white">{Math.max(totalUsers, scoreboard.length)}</strong>
                  <span className="text-[10px] text-[#39ff14]">active streams</span>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">Latency: <b className="text-[#39ff14]">14ms</b> &nbsp;|&nbsp; Load: <b className="text-cyan-400">Optimal</b></p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 border border-slate-800 bg-[#090c14] p-5">
          <PanelTitle>TOP 10 PLAYER SCORE PROGRESSION TRACE</PanelTitle>
          <div className="mt-4 h-44 w-full overflow-hidden">
            <svg viewBox="0 0 1000 170" preserveAspectRatio="none" className="h-full w-full">
              {[25, 55, 85, 115, 145].map((y) => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#151c2b" strokeWidth="1" />)}
              {tracePoints.length > 1 && <polyline points={tracePoints.join(" ")} fill="none" stroke="#39ff14" strokeWidth="2" />}
              {tracePoints.map((point) => {
                const [x, y] = point.split(",");
                return <circle key={point} cx={x} cy={y} r="3" fill="#39ff14" />;
              })}
            </svg>
          </div>
        </section>

        <section className="mt-5 overflow-hidden border border-slate-800 bg-[#090c14]">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="text-sm font-bold tracking-wider text-[#39ff14]">TEAM RANKINGS</h2>
            <span className="text-[10px] text-slate-600">Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d111c] text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Team</th><th className="px-5 py-3">Category</th><th className="px-5 py-3 text-center">Solves</th><th className="px-5 py-3 text-right">Score</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="h-12 animate-pulse bg-slate-900/40" /></tr>) : scoreboard.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-600">No teams have scored yet.</td></tr>
                ) : scoreboard.map((team) => (
                  <tr key={team.teamId} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-bold text-slate-400">{team.rank <= 3 ? <Medal className={`inline h-4 w-4 ${team.rank === 1 ? "text-yellow-400" : team.rank === 2 ? "text-slate-300" : "text-orange-400"}`} /> : `#${team.rank}`}</td>
                    <td className="px-5 py-3"><span className="font-bold text-white">{team.teamName}</span><span className="ml-3 text-[10px] text-slate-600">{team.members.join(", ")}</span></td>
                    <td className="px-5 py-3 text-slate-400">{team.solves[0]?.category || "—"}</td>
                    <td className="px-5 py-3 text-center text-slate-300">{team.solveCount}</td>
                    <td className="px-5 py-3 text-right font-black text-[#39ff14]">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-black tracking-widest text-[#39ff14]">{children}</h2>;
}

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: "lime" | "cyan" | "pink" }) {
  const styles = { lime: ["#39ff14", "bg-green-950/50"], cyan: ["#00f0ff", "bg-cyan-950/50"], pink: ["#ff20f0", "bg-fuchsia-950/50"] }[color];
  return (
    <div className="flex items-center gap-4 border border-slate-800 border-l-4 bg-[#090c14] px-5 py-6" style={{ borderLeftColor: styles[0] }}>
      <div className={`rounded-lg p-3 ${styles[1]}`} style={{ color: styles[0] }}>{icon}</div>
      <div><p className="text-[10px] tracking-widest text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-white">{value}</strong></div>
    </div>
  );
}
