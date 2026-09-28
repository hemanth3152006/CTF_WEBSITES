"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Shield,
  PlusCircle,
  Radio,
  Users,
  Terminal,
  Trash2,
  Ban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"challenges" | "feed" | "teams" | "announcements">("challenges");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Challenges state
  const [challenges, setChallenges] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Web");
  const [newLevel, setNewLevel] = useState("1");
  const [newDifficulty, setNewDifficulty] = useState("MEDIUM");
  const [newPoints, setNewPoints] = useState("100");
  const [newFlag, setNewFlag] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newHintCost, setNewHintCost] = useState("10");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileName, setNewFileName] = useState("");

  // Feed & Teams state
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Announcements state
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");
  const [announcePinned, setAnnouncePinned] = useState(true);
  const [timerPaused, setTimerPaused] = useState(true);
  const [eventStarted, setEventStarted] = useState(false);
  const [timerDuration, setTimerDuration] = useState("24");
  const [timerBusy, setTimerBusy] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      const chRes = await fetch("/api/challenges");
      if (chRes.ok) {
        const chData = await chRes.json();
        setChallenges(chData.challenges || []);
      }

      const subRes = await fetch("/api/admin/submissions");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
        setTeams(subData.teams || []);
      }

      const timerRes = await fetch("/api/event/timer");
      if (timerRes.ok) {
        const timerData = await timerRes.json();
        setTimerPaused(Boolean(timerData.isPaused));
        setEventStarted(Boolean(timerData.eventStarted));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Poll updates every 20s
    return () => clearInterval(interval);
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          level: Number(newLevel),
          difficulty: newDifficulty,
          points: Number(newPoints),
          flag: newFlag,
          description: newDescription,
          fileUrl: newFileUrl || undefined,
          fileName: newFileName || undefined,
          hints: newHint ? [{ content: newHint, cost: Number(newHintCost) }] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to create challenge." });
        return;
      }

      setMessage({ type: "success", text: "Challenge created and deployed to Arena!" });
      setNewTitle("");
      setNewFlag("");
      setNewDescription("");
      setNewHint("");
      setNewFileUrl("");
      setNewFileName("");
      loadData();
    } catch {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge? This will remove all solves and submissions.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/challenges?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Challenge deleted." });
        loadData();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete challenge." });
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isVisible: !isVisible }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update challenge visibility." });
        return;
      }
      setMessage({ type: "success", text: data.message });
      loadData();
    } catch {
      setMessage({ type: "error", text: "Failed to update challenge visibility." });
    }
  };

  const handleToggleChallengePause = async (id: string, isPaused: boolean) => {
    let pauseMinutes = 30;
    if (!isPaused) {
      const value = prompt("Pause this challenge for how many minutes?", "30");
      if (value === null) return;
      pauseMinutes = Number(value);
      if (!Number.isFinite(pauseMinutes) || pauseMinutes < 1) {
        setMessage({ type: "error", text: "Pause duration must be at least 1 minute." });
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: isPaused ? "resume" : "pause", pauseMinutes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update challenge pause state." });
        return;
      }
      setMessage({ type: "success", text: data.message });
      loadData();
    } catch {
      setMessage({ type: "error", text: "Failed to update challenge pause state." });
    }
  };

  const handleTimerAction = async (action: "pause" | "start" | "start-event" | "reset") => {
    if (action === "start-event" && !confirm(`Start the event with a ${timerDuration}-hour countdown?`)) return;
    if (action === "reset" && !confirm("Reset the event to not started?")) return;

    setTimerBusy(true);
    try {
      const res = await fetch("/api/admin/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, durationHours: Number(timerDuration) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update event timer." });
        return;
      }
      setTimerPaused(Boolean(data.config?.isPaused));
      setEventStarted(Boolean(data.config?.eventStarted));
      setMessage({ type: "success", text: data.message });
    } catch {
      setMessage({ type: "error", text: "Failed to update event timer." });
    } finally {
      setTimerBusy(false);
    }
  };

  const handleToggleBan = async (teamId: string, currentBanned: boolean) => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, isBanned: !currentBanned }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Team ${!currentBanned ? "disqualified" : "reinstated"}.` });
        loadData();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update team ban status." });
    }
  };

  const handleAdjustPoints = async (teamId: string) => {
    const amountStr = prompt("Enter point adjustment (e.g. 50 to add, -50 to deduct):");
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return;

    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, pointsAdjustment: amount }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Adjusted team points by ${amount}.` });
        loadData();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to adjust points." });
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announceTitle,
          content: announceContent,
          isPinned: announcePinned,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Announcement broadcasted live to all teams!" });
        setAnnounceTitle("");
        setAnnounceContent("");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to broadcast announcement." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono">
        Loading Command Center...
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 p-8 rounded-xl bg-slate-900 border border-rose-500/30 text-center">
          <Shield className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-xs text-slate-400">
            You must be logged in as an Administrator to access the Command Center.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-mono">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide">
                CTF COMMAND CENTER
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Administer challenges, inspect live flag submissions, monitor anti-cheat, and moderate teams.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              ADMINISTRATOR: @{currentUser.username}
            </span>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/50 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Event Timer Control</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Set the duration, confirm Start Event, and the countdown will begin for everyone.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label htmlFor="timer-duration" className="text-slate-400">Reset hours</label>
            <input
              id="timer-duration"
              type="number"
              min={1}
              max={168}
              value={timerDuration}
              onChange={(e) => setTimerDuration(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              disabled={timerBusy}
              onClick={() => handleTimerAction("start-event")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 font-bold transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {eventStarted ? "Restart Event" : "Start Event"}
            </button>
            <button
              type="button"
              disabled={timerBusy || !eventStarted}
              onClick={() => handleTimerAction(timerPaused ? "start" : "pause")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition disabled:opacity-50 ${
                timerPaused
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
              }`}
            >
              {timerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {timerPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              disabled={timerBusy}
              onClick={() => handleTimerAction("reset")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 font-bold transition disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Timer
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "challenges"
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Challenges ({challenges.length})
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "feed"
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            Live Submissions & Anti-Cheat ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "teams"
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Team Moderation ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "announcements"
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Broadcast Alerts
          </button>
        </div>

        {/* Tab 1: Challenges Management */}
        {activeTab === "challenges" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Challenge Form */}
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800">
              <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Create New Challenge</span>
              </h3>

              <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Kernel Memory Leak"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Web">Web</option>
                      <option value="Crypto">Crypto</option>
                      <option value="Forensics">Forensics</option>
                      <option value="Reverse">Reverse</option>
                      <option value="OSINT">OSINT</option>
                      <option value="Misc">Misc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Level</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                      <option value="INSANE">INSANE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Points</label>
                    <input
                      type="number"
                      step={50}
                      required
                      value={newPoints}
                      onChange={(e) => setNewPoints(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">
                    Plaintext Flag (Will be Salted & Hashed)
                  </label>
                  <input
                    type="text"
                    required
                    value={newFlag}
                    onChange={(e) => setNewFlag(e.target.value)}
                    placeholder="CTF{secret_flag_value}"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Enter challenge briefing..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1">Optional Hint</label>
                    <input
                      type="text"
                      value={newHint}
                      onChange={(e) => setNewHint(e.target.value)}
                      placeholder="Hint text..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Hint Cost (Pts)</label>
                    <input
                      type="number"
                      value={newHintCost}
                      onChange={(e) => setNewHintCost(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 mb-1">File URL / Link</label>
                    <input
                      type="text"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      placeholder="/files/task.zip"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">File Name</label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="task.zip"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition mt-2"
                >
                  Deploy Challenge
                </button>
              </form>
            </div>

            {/* Existing Challenges List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-white mb-2">
                Active Challenges ({challenges.length})
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {challenges.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{c.title}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {c.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          L{c.level}
                        </span>
                        <span className="text-emerald-400 font-bold">{c.points} pts</span>
                        <span className={`px-1.5 py-0.5 rounded border ${
                          c.isPaused
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            : c.isVisible
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        }`}>
                          {c.isPaused ? "PAUSED" : c.isVisible ? "VISIBLE" : "HIDDEN"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.solveCount} solves • {c.hints?.length || 0} hints
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleChallengePause(c.id, Boolean(c.isPaused))}
                        className={`p-2 rounded-lg transition border border-transparent ${
                          c.isPaused
                            ? "text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                            : "text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/30"
                        }`}
                        title={c.isPaused ? "Resume Challenge" : "Pause Challenge"}
                        aria-label={c.isPaused ? `Resume ${c.title}` : `Pause ${c.title}`}
                      >
                        {c.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(c.id, c.isVisible)}
                        className={`p-2 rounded-lg transition border border-transparent ${
                          c.isVisible
                            ? "text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/30"
                            : "text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                        }`}
                        title={c.isVisible ? "Hide Challenge" : "Show Challenge"}
                        aria-label={c.isVisible ? `Hide ${c.title}` : `Show ${c.title}`}
                      >
                        {c.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(c.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/30"
                        title="Delete Challenge"
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Flag Submissions & Anti-Cheat */}
        {activeTab === "feed" && (
          <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Live Flag Verification & Anti-Cheat Stream</span>
              </div>
              <span className="text-slate-500 text-[11px]">
                Showing last {submissions.length} attempts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Challenge</th>
                    <th className="py-3 px-4">Submitted String</th>
                    <th className="py-3 px-4">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No submissions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4">
                          {s.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {s.isFirstBlood ? "🩸 1st BLOOD" : "CORRECT"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400">
                              <XCircle className="w-3.5 h-3.5" /> INCORRECT
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                          {new Date(s.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white">{s.team.name}</td>
                        <td className="py-2.5 px-4 text-slate-400">@{s.user.username}</td>
                        <td className="py-2.5 px-4 text-slate-300">{s.challenge.title}</td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px] font-mono">
                          {s.submittedFlag}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                          {s.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Team Moderation */}
        {activeTab === "teams" && (
          <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
            <div className="p-4 border-b border-slate-800 font-bold text-white bg-slate-950/50">
              Registered Teams & Disqualification Controls
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Team Name</th>
                    <th className="py-3 px-4">Join Code</th>
                    <th className="py-3 px-4">Affiliation</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Solves</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span>{t.name}</span>
                        {t.isBanned && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                            BANNED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{t.joinCode}</td>
                      <td className="py-3 px-4 text-slate-400">{t.affiliation || "—"}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {t.members.map((m: any) => m.username).join(", ")}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{t.points}</td>
                      <td className="py-3 px-4 text-slate-300">{t._count?.solves || 0}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleAdjustPoints(t.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          Adjust Pts
                        </button>
                        <button
                          onClick={() => handleToggleBan(t.id, t.isBanned)}
                          className={`px-2.5 py-1 rounded border ${
                            t.isBanned
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {t.isBanned ? "Unban" : "Disqualify"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Broadcast Announcements */}
        {activeTab === "announcements" && (
          <div className="mt-6 max-w-xl p-6 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Broadcast Live Announcement</span>
            </h3>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder="e.g. Hint released for Crypto Level 3"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                  placeholder="Provide full announcement details..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={announcePinned}
                  onChange={(e) => setAnnouncePinned(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <label htmlFor="pinned" className="text-slate-300 cursor-pointer">
                  Pin to top of participant dashboards
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                Send Broadcast
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
