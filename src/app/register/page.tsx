"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { UserPlus, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamAction, setTeamAction] = useState<"create" | "join" | "none">("create");
  const [teamName, setTeamName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventStarted, setEventStarted] = useState(false);
  const [checkingEvent, setCheckingEvent] = useState(true);

  useEffect(() => {
    const refreshEventStatus = async () => {
      try {
        const res = await fetch("/api/event/timer");
        const data = res.ok ? await res.json() : null;
        setEventStarted(Boolean(data?.eventStarted));
      } catch {
        setEventStarted(false);
      } finally {
        setCheckingEvent(false);
      }
    };

    queueMicrotask(() => void refreshEventStatus());
    const interval = setInterval(refreshEventStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          teamAction,
          teamName: teamAction === "create" ? teamName : undefined,
          affiliation: teamAction === "create" ? affiliation : undefined,
          joinCode: teamAction === "join" ? joinCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      router.push("/arena");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-white">TEAM REGISTRATION</h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Initialize your hacker identity and register your collegiate team
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-xs">
              {error}
            </div>
          )}

          {checkingEvent ? (
            <div className="py-10 text-center font-mono text-xs text-slate-400">
              Checking event registration status...
            </div>
          ) : !eventStarted ? (
            <div className="py-10 text-center font-mono text-xs text-amber-300">
              Registration opens when the administrator starts the event.
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="zero_cool"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hacker@college.edu"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Password (min 6 chars)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Team Option Selector */}
            <div className="pt-2">
              <label className="block text-slate-300 mb-2 font-medium">Team Formation Option</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTeamAction("create")}
                  className={`py-2 px-2 text-center rounded-lg border text-xs transition ${
                    teamAction === "create"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setTeamAction("join")}
                  className={`py-2 px-2 text-center rounded-lg border text-xs transition ${
                    teamAction === "join"
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Join Code
                </button>
                <button
                  type="button"
                  onClick={() => setTeamAction("none")}
                  className={`py-2 px-2 text-center rounded-lg border text-xs transition ${
                    teamAction === "none"
                      ? "bg-slate-800 border-slate-600 text-slate-200 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Decide Later
                </button>
              </div>
            </div>

            {/* Dynamic Team Fields */}
            {teamAction === "create" && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">New Team Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CyberKnights"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    College / Dept (Optional)
                  </label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. Dept of CS & IT"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {teamAction === "join" && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Team Invite Join Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KNIGHT-2026"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 uppercase tracking-widest font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !email || !password}
              className="w-full py-2.5 mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              <span>{loading ? "Registering..." : "Complete Registration"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 text-center font-mono text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
