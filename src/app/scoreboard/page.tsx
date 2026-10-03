"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Trophy,
  Medal,
  Flame,
  RefreshCw,
  Snowflake,
} from "lucide-react";

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
  solves: {
    challengeId: string;
    challengeTitle: string;
    category: string;
    points: number;
    isFirstBlood: boolean;
    solvedAt: string;
  }[];
}

interface EventData {
  title: string;
  isFrozen: boolean;
  endTime?: string;
  startTime?: string;
}

export default function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreboardTeam[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchScoreboard = () => {
    fetch("/api/scoreboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.scoreboard) {
          setScoreboard(data.scoreboard);
          setEventData(data.event);
          setLastUpdated(new Date());
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScoreboard();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchScoreboard, 15000); // 15 seconds poll
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> #1 GOLD
          </span>
        );
      case 2:
        return (
          <span className="flex items-center gap-1 font-bold text-slate-300 bg-slate-400/10 border border-slate-400/30 px-2 py-0.5 rounded text-xs">
            <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 SILVER
          </span>
        );
      case 3:
        return (
          <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-700/10 border border-amber-700/30 px-2 py-0.5 rounded text-xs">
            <Medal className="w-3.5 h-3.5 text-amber-600" /> #3 BRONZE
          </span>
        );
      default:
        return <span className="font-mono text-slate-400 font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wide">
                TACTICAL SCOREBOARD
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-400">
              Live standings for {eventData?.title || "24-Hour CTF"}. Rankings update automatically.
            </p>
          </div>

          {/* Controls: Auto-refresh & Timestamp */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchScoreboard()}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              title="Manual Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                autoRefresh
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-900 text-slate-500 border-slate-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                }`}
              />
              <span>{autoRefresh ? "Live Sync (15s)" : "Sync Paused"}</span>
            </button>

            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Frozen Warning Banner if event is frozen */}
        {eventData?.isFrozen && (
          <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Snowflake className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              <strong>SCOREBOARD FROZEN:</strong> The leaderboard has been frozen by contest
              organizers to build final suspense. Solves will continue to be recorded internally.
            </span>
          </div>
        )}

        {/* Top 3 Podium (if >= 3 teams) */}
        {scoreboard.length >= 3 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
            {/* 2nd Place */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center flex flex-col items-center order-2 md:order-1">
              <Medal className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                2nd Place
              </span>
              <h3 className="text-lg font-bold font-mono text-white mt-1">
                {scoreboard[1].teamName}
              </h3>
              {scoreboard[1].affiliation && (
                <span className="text-xs font-mono text-slate-400">
                  {scoreboard[1].affiliation}
                </span>
              )}
              <div className="mt-3 text-2xl font-black font-mono text-emerald-400">
                {scoreboard[1].points} <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
            </div>

            {/* 1st Place (Taller) */}
            <div className="p-6 rounded-xl bg-amber-950/20 border border-amber-500/50 text-center flex flex-col items-center order-1 md:order-2 shadow-[0_0_30px_rgba(245,158,11,0.15)] -translate-y-2">
              <Trophy className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                1st Place Champion
              </span>
              <h3 className="text-xl font-bold font-mono text-white mt-1">
                {scoreboard[0].teamName}
              </h3>
              {scoreboard[0].affiliation && (
                <span className="text-xs font-mono text-slate-400">
                  {scoreboard[0].affiliation}
                </span>
              )}
              <div className="mt-3 text-3xl font-black font-mono text-amber-400">
                {scoreboard[0].points} <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
              {scoreboard[0].firstBloods > 0 && (
                <div className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{scoreboard[0].firstBloods} First Bloods</span>
                </div>
              )}
            </div>

            {/* 3rd Place */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center flex flex-col items-center order-3">
              <Medal className="w-8 h-8 text-amber-600 mb-2" />
              <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">
                3rd Place
              </span>
              <h3 className="text-lg font-bold font-mono text-white mt-1">
                {scoreboard[2].teamName}
              </h3>
              {scoreboard[2].affiliation && (
                <span className="text-xs font-mono text-slate-400">
                  {scoreboard[2].affiliation}
                </span>
              )}
              <div className="mt-3 text-2xl font-black font-mono text-emerald-400">
                {scoreboard[2].points} <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
            </div>
          </div>
        )}

        {/* Scoreboard Table */}
        <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4">Affiliation</th>
                  <th className="py-3.5 px-4 text-center">Solves</th>
                  <th className="py-3.5 px-4 text-center">First Bloods</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-right">Last Submission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="py-4 px-4 h-12 bg-slate-900/40" />
                    </tr>
                  ))
                ) : scoreboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-500 font-mono"
                    >
                      No teams have scored yet. The competition is waiting for First Blood!
                    </td>
                  </tr>
                ) : (
                  scoreboard.map((team) => (
                    <tr
                      key={team.teamId}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-4 text-center">
                        {getRankBadge(team.rank)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-emerald-400 transition text-sm">
                          {team.teamName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {team.members.join(", ")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {team.affiliation || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                        {team.solveCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {team.firstBloods > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs">
                            <Flame className="w-3.5 h-3.5" />
                            {team.firstBloods}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-emerald-400">
                        {team.points}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {team.lastSubmissionTime
                          ? new Date(team.lastSubmissionTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
