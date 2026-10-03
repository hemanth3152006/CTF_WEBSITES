"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Eye, EyeOff, RefreshCw, Shield } from "lucide-react";

interface HiddenChallenge {
  id: string;
  title: string;
  category: string;
  level: number;
  points: number;
  solveCount: number;
  hints: { id: string }[];
}

interface AdminUser {
  username: string;
  role: string;
}

export default function HiddenChallengesPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [challenges, setChallenges] = useState<HiddenChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadChallenges = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = meRes.ok ? await meRes.json() : null;
      setCurrentUser(meData?.user || null);
      if (meData?.user?.role !== "ADMIN") return;

      const res = await fetch("/api/admin/challenges?visibility=hidden");
      const data = res.ok ? await res.json() : null;
      setChallenges(data?.challenges || []);
    } catch {
      setMessage("Failed to load hidden challenges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadChallenges());
  }, []);

  const handleUnhide = async (challenge: HiddenChallenge) => {
    setBusyId(challenge.id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: challenge.id, isVisible: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to unhide challenge.");
        return;
      }
      setChallenges((previous) => previous.filter((item) => item.id !== challenge.id));
      setMessage(`${challenge.title} is visible in the Arena again.`);
    } catch {
      setMessage("Failed to unhide challenge.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono">
        Loading hidden challenges...
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 p-8 rounded-xl bg-slate-900 border border-rose-500/30 text-center">
          <Shield className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-xs text-slate-400">Only administrators can manage hidden challenges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Command Center
            </Link>
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">HIDDEN CHALLENGES</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Only administrators can restore challenges to the Arena.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadChallenges()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-500 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {message && <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs text-cyan-300">{message}</div>}

        <section className="mt-6 space-y-3">
          {challenges.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center">
              <Eye className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-white font-bold">No hidden challenges</p>
              <p className="text-xs text-slate-500 mt-1">All challenges are currently visible in the Arena.</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-white">{challenge.title}</h2>
                    <span className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-300">{challenge.category}</span>
                    <span className="rounded border border-cyan-800/50 bg-cyan-950/50 px-2 py-0.5 text-[10px] text-cyan-300">L{challenge.level}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{challenge.points} points · {challenge.solveCount} solves · {challenge.hints.length} hints</p>
                </div>
                <button
                  type="button"
                  disabled={busyId === challenge.id}
                  onClick={() => void handleUnhide(challenge)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {busyId === challenge.id ? "Unhiding..." : "Unhide Challenge"}
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
