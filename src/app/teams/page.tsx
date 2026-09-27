"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Users,
  Copy,
  Check,
  PlusCircle,
  LogIn,
  Trophy,
  Shield,
  Award,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  username: string;
  role: string;
}

interface TeamData {
  id: string;
  name: string;
  joinCode: string;
  affiliation?: string | null;
  points: number;
  members: Member[];
}

export default function TeamsPage() {
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form states
  const [createName, setCreateName] = useState("");
  const [createAffiliation, setCreateAffiliation] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.team) {
          setTeam(data.user.team);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          affiliation: createAffiliation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create team.");
        return;
      }

      setFormSuccess("Team created successfully!");
      fetchSession();
    } catch {
      setFormError("Network error while creating team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCodeInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to join team.");
        return;
      }

      setFormSuccess("Joined team successfully!");
      fetchSession();
    } catch {
      setFormError("Network error while joining team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-slate-900 rounded w-1/3" />
            <div className="h-64 bg-slate-900 rounded" />
          </div>
        ) : !user ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-xl p-8">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold font-mono text-white mb-2">Authentication Required</h2>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto mb-6">
              You must sign in to view, create, or join a competitive team.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-medium transition"
              >
                Register
              </Link>
            </div>
          </div>
        ) : team ? (
          /* User has a Team: Dashboard View */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wide">
                    {team.name}
                  </h1>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  {team.affiliation || "Independent Team"}
                </p>
              </div>

              {/* Points badge */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Score</div>
                  <div className="font-mono text-lg font-bold text-emerald-400">
                    {team.points} <span className="text-xs font-normal text-slate-500">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Join Code Card (Important for team sharing) */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono uppercase text-slate-400 font-bold mb-1">
                  Team Invite Join Code
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Share this code with up to 3 other teammates so they can join your squad.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-white tracking-wider bg-slate-950 px-4 py-2 rounded-lg border border-slate-700">
                  {team.joinCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition"
                  title="Copy code"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Team Members Roster */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Team Roster (
                {team.members.length} / 4)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">@{member.username}</div>
                      <div className="text-[10px] text-slate-500">{member.role}</div>
                    </div>
                    {member.id === user.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        YOU
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* User has no team: Option to Create or Join */
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-wide mb-2">
                TEAM FORMATION
              </h1>
              <p className="text-xs sm:text-sm font-mono text-slate-400">
                Participation requires membership in a team (1 to 4 members). Create a squad or enter an invite code.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono text-xs">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs">
                {formSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Create a Team */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-mono font-bold text-base text-white">Create a New Team</h3>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-6">
                    Found a team as the captain. You will receive a unique join code to invite your teammates.
                  </p>

                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        required
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="e.g. ByteBusters"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        Affiliation / College (Optional)
                      </label>
                      <input
                        type="text"
                        value={createAffiliation}
                        onChange={(e) => setCreateAffiliation(e.target.value)}
                        placeholder="e.g. Dept of Cyber Security"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !createName.trim()}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Creating..." : "Establish Team"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Option 2: Join Existing Team */}
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <LogIn className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-mono font-bold text-base text-white">Join an Existing Team</h3>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-6">
                    Enter the unique 8-character join code provided by your team leader.
                  </p>

                  <form onSubmit={handleJoinTeam} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        Team Join Code
                      </label>
                      <input
                        type="text"
                        required
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. BYTE-8X92"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !joinCodeInput.trim()}
                      className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition disabled:opacity-50 mt-14"
                    >
                      {isSubmitting ? "Joining..." : "Join Squad"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
