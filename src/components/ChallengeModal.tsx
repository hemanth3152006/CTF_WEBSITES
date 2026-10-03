"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  X,
  Flag,
  Award,
  Download,
  Lightbulb,
  CheckCircle2,
  Flame,
  ShieldAlert,
} from "lucide-react";

export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  category: string;
  level: number;
  difficulty: string;
  points: number;
  flagFormat: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  isPaused?: boolean;
  pausedUntil?: string | null;
  solveCount: number;
  isSolved: boolean;
  firstBlood: string | null;
  hints: {
    id: string;
    cost: number;
    isUnlocked: boolean;
    content?: string;
  }[];
}

interface ChallengeModalProps {
  challenge: ChallengeData | null;
  onClose: () => void;
  onSuccess: (challengeId: string, isFirstBlood: boolean, points: number) => void;
}

export default function ChallengeModal({
  challenge,
  onClose,
  onSuccess,
}: ChallengeModalProps) {
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "firstblood";
    text: string;
  } | null>(null);

  const [unlockedHints, setUnlockedHints] = useState<{ [id: string]: string }>({});
  const [unlockingHintId, setUnlockingHintId] = useState<string | null>(null);

  if (!challenge) return null;

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/challenges/${challenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Flag verification failed.",
        });
        return;
      }

      if (data.isFirstBlood) {
        setStatusMessage({
          type: "firstblood",
          text: data.message || "🩸 FIRST BLOOD! Incredible performance!",
        });
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#ef4444", "#dc2626", "#f97316", "#ffffff"],
        });
      } else {
        setStatusMessage({
          type: "success",
          text: data.message || "Flag Captured! Points awarded.",
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#065f46"],
        });
      }

      onSuccess(challenge.id, data.isFirstBlood, data.pointsAwarded);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network or server error while submitting flag.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockHint = async (hintId: string, cost: number) => {
    if (
      !confirm(
        `Unlocking this hint will deduct ${cost} points from your team's total score. Are you sure?`
      )
    ) {
      return;
    }

    setUnlockingHintId(hintId);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hintId }),
      });

      const data = await res.json();
      if (res.ok && data.content) {
        setUnlockedHints((prev) => ({ ...prev, [hintId]: data.content }));
      } else {
        alert(data.error || "Failed to unlock hint.");
      }
    } catch {
      alert("Error contacting server.");
    } finally {
      setUnlockingHintId(null);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toUpperCase()) {
      case "EASY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "HARD":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "INSANE":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {challenge.category}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${getDifficultyBadge(
                  challenge.difficulty
                )}`}
              >
                {challenge.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                Level {challenge.level}
              </span>
              <span className="text-xs text-slate-400 font-mono ml-auto">
                {challenge.solveCount} {challenge.solveCount === 1 ? "solve" : "solves"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              {challenge.title}
              {challenge.isSolved && (
                <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* First Blood indicator */}
        {challenge.firstBlood && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>
              First Blood captured by: <strong className="text-white font-bold">{challenge.firstBlood}</strong>
            </span>
          </div>
        )}

        {/* Points & Description */}
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400">Award:</span>
            <div className="flex items-center gap-1 text-emerald-400 font-mono text-xl font-bold">
              <Award className="w-5 h-5" />
              <span>{challenge.points} PTS</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {challenge.description}
          </div>

          {/* Download File Attachment if present */}
          {challenge.fileUrl && (
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-slate-200">
                  {challenge.fileName || "challenge_asset.zip"}
                </span>
                {challenge.fileSize && (
                  <span className="text-xs font-mono text-slate-500">
                    ({challenge.fileSize})
                  </span>
                )}
              </div>
              <a
                href={challenge.fileUrl}
                download
                className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition"
              >
                Download File
              </a>
            </div>
          )}

          {/* Hints Section */}
          {challenge.hints && challenge.hints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Tactical Hints
              </h4>
              <div className="space-y-2">
                {challenge.hints.map((hint, idx) => {
                  const unlockedText = unlockedHints[hint.id] || hint.content;
                  return (
                    <div
                      key={hint.id}
                      className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs font-mono"
                    >
                      {unlockedText ? (
                        <div className="text-amber-200/90 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{unlockedText}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">
                            Hint #{idx + 1} ({hint.cost} pts penalty)
                          </span>
                          <button
                            onClick={() => handleUnlockHint(hint.id, hint.cost)}
                            disabled={unlockingHintId === hint.id}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition"
                          >
                            {unlockingHintId === hint.id ? "Unlocking..." : `Unlock (-${hint.cost} pts)`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg border font-mono text-xs mb-4 flex items-center gap-2 ${
              statusMessage.type === "firstblood"
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                : statusMessage.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/30 text-rose-400"
            }`}
          >
            {statusMessage.type === "error" ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Flag Submission Form */}
        <form onSubmit={handleSubmitFlag} className="pt-2 border-t border-slate-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Flag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder={challenge.flagFormat ? challenge.flagFormat.replace("...", "flag_goes_here") : "CYFOX{flag_goes_here}"}
                disabled={submitting || challenge.isSolved}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white font-mono text-sm placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || challenge.isSolved || !flag.trim()}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-mono text-sm font-semibold transition shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              {submitting ? "Checking..." : challenge.isSolved ? "Solved" : "Submit Flag"}
            </button>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Format: {challenge.flagFormat}</span>
            <span>Rate-limited: 5 attempts / 30s</span>
          </div>
        </form>
      </div>
    </div>
  );
}
