"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChallengeModal, { ChallengeData } from "@/components/ChallengeModal";
import Link from "next/link";
import {
  Flag,
  Award,
  Search,
  CheckCircle2,
  Flame,
  Filter,
  Sparkles,
  Lock,
  Shield,
  PauseCircle,
} from "lucide-react";

function PausedChallengeNotice({
  challenge,
  onExpired,
}: {
  challenge: ChallengeData;
  onExpired: () => void;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!challenge.pausedUntil) return 0;
    return Math.max(0, Math.ceil((new Date(challenge.pausedUntil).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!challenge.pausedUntil) return;
      setRemainingSeconds(Math.max(0, Math.ceil((new Date(challenge.pausedUntil).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [challenge.pausedUntil]);

  useEffect(() => {
    if (challenge.pausedUntil && remainingSeconds === 0) onExpired();
  }, [challenge.pausedUntil, onExpired, remainingSeconds]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const format = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="min-h-44 flex flex-col items-center justify-center text-center">
      <PauseCircle className="w-9 h-9 text-amber-400 mb-3" />
      <h3 className="font-mono font-bold text-base text-white mb-1">WILL BE BACK SOON</h3>
      <p className="text-xs font-mono text-slate-400 mb-4">{challenge.title} is temporarily paused.</p>
      <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xl font-bold tracking-wider">
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Until challenge returns</span>
    </div>
  );
}

export default function ArenaPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeData | null>(null);
  const [eventPaused, setEventPaused] = useState(false);
  const wasEventPaused = useRef(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set(challenges.map((c) => c.category));
    return ["All", ...Array.from(set)];
  }, [challenges]);

  const fetchChallenges = () => {
    setLoading(true);
    fetch("/api/challenges")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.challenges) {
          setChallenges(data.challenges);
        }
        if (data?.eventPaused) {
          setEventPaused(true);
          setSelectedChallenge(null);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setCurrentUser(data.user);
          fetchChallenges();
        } else {
          router.replace("/login?next=/arena");
        }
      })
      .catch(() => router.replace("/login?next=/arena"));
  }, [router]);

  useEffect(() => {
    const checkEventStatus = () => {
      fetch("/api/event/timer")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const paused = Boolean(data?.isPaused);
          setEventPaused(paused);
          if (paused) {
            wasEventPaused.current = true;
            setChallenges([]);
            setSelectedChallenge(null);
          } else if (wasEventPaused.current) {
            wasEventPaused.current = false;
            fetchChallenges();
          }
        })
        .catch(() => undefined);
    };

    checkEventStatus();
    const interval = setInterval(checkEventStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChallengeSolveSuccess = (
    challengeId: string,
    isFirstBlood: boolean,
    points: number
  ) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              isSolved: true,
              solveCount: c.solveCount + 1,
            }
          : c
      )
    );
    // Refresh to get updated points and first blood info
    fetchChallenges();
  };

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchCategory =
        activeCategory === "All" ||
        c.category.toLowerCase() === activeCategory.toLowerCase();
      const matchLevel =
        selectedLevel === "All" || c.level.toString() === selectedLevel;
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchLevel && matchSearch;
    });
  }, [challenges, activeCategory, selectedLevel, searchQuery]);

  const totalPoints = challenges.reduce((acc, c) => acc + c.points, 0);
  const solvedPoints = challenges
    .filter((c) => c.isSolved)
    .reduce((acc, c) => acc + c.points, 0);
  const solvedCount = challenges.filter((c) => c.isSolved).length;

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case "EASY":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "MEDIUM":
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case "HARD":
        return "text-rose-400 border-rose-500/30 bg-rose-500/10";
      case "INSANE":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default:
        return "text-slate-400 border-slate-700 bg-slate-800";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organizer Preview Banner */}
        {currentUser?.role === "ADMIN" && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-white uppercase tracking-wider">ORGANIZER PREVIEW MODE:</span>
                <p className="text-[11px] text-rose-300/80">You are reviewing the challenge matrix as an Administrator.</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            >
              Back to Command Center →
            </Link>
          </div>
        )}

        {/* Arena Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-5 h-5 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wide">
                OPERATIONAL ARENA
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-mono text-slate-400">
              Select an active vector, exploit vulnerabilities, and capture encrypted flags.
            </p>
          </div>

          {/* User Team Progress Summary */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-500">Solved</div>
                <div className="font-mono text-base font-bold text-emerald-400">
                  {solvedCount} / {challenges.length}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-500">Points</div>
                <div className="font-mono text-base font-bold text-white">
                  {solvedPoints} <span className="text-xs text-slate-500">/ {totalPoints}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition shrink-0 ${
                  activeCategory === cat
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Level Controls */}
          <div className="flex items-center gap-3">
            {/* Level Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900">All</option>
                <option value="1" className="bg-slate-900">Level 1</option>
                <option value="2" className="bg-slate-900">Level 2</option>
                <option value="3" className="bg-slate-900">Level 3</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Challenge Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-slate-900/50 border border-slate-800/80 animate-pulse"
                />
              ))}
            </div>
          ) : eventPaused ? (
            <div className="text-center py-20 bg-amber-950/20 border border-amber-500/30 rounded-xl">
              <PauseCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-mono text-sm text-amber-300">
                The event is currently paused. Challenges and flag submissions are unavailable.
              </div>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 border border-slate-800/50 rounded-xl">
              <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="font-mono text-sm text-slate-400">
                No challenges match the active filter criteria.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  onClick={() => {
                    if (!challenge.isPaused) setSelectedChallenge(challenge);
                  }}
                  className={`group relative p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    challenge.isPaused
                      ? "bg-amber-950/20 border-amber-500/30 cursor-default"
                      : challenge.isSolved
                      ? "bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  }`}
                >
                  {challenge.isPaused ? (
                    <PausedChallengeNotice challenge={challenge} onExpired={fetchChallenges} />
                  ) : (
                    <>
                  {/* Top tags */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {challenge.category}
                        </span>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getDifficultyColor(
                            challenge.difficulty
                          )}`}
                        >
                          {challenge.difficulty}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          L{challenge.level}
                        </span>
                      </div>

                      {challenge.isSolved && (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SOLVED</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-mono font-bold text-base text-white group-hover:text-emerald-400 transition mb-2">
                      {challenge.title}
                    </h3>

                    <p className="text-xs font-mono text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {challenge.description}
                    </p>
                  </div>

                  {/* Card Footer: Points, Solves & First Blood */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 font-bold text-emerald-400">
                      <Award className="w-4 h-4" />
                      <span>{challenge.points} PTS</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {challenge.firstBlood && (
                        <span
                          title={`First Blood: ${challenge.firstBlood}`}
                          className="flex items-center gap-1 text-rose-400 font-semibold"
                        >
                          <Flame className="w-3.5 h-3.5 animate-pulse" />
                        </span>
                      )}
                      <span className="text-slate-500">
                        {challenge.solveCount} {challenge.solveCount === 1 ? "solve" : "solves"}
                      </span>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Challenge Solve Modal */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onSuccess={handleChallengeSolveSuccess}
        />
      )}
    </div>
  );
}
