"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Terminal, Lock, User, ArrowRight, Users, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"participant" | "admin">("participant");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const submittedLogin = String(formData.get("login") || "").trim();
    const submittedPassword = String(formData.get("password") || "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: submittedLogin, password: submittedPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      // Replace the login history entry after the session cookie is set.
      if (data.user?.role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/arena");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition shadow-lg ${
                loginMode === "admin"
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              }`}
            >
              {loginMode === "admin" ? <Shield className="w-6 h-6" /> : <Terminal className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-bold font-mono text-white tracking-wide">
              {loginMode === "admin" ? "ORGANIZER COMMAND ACCESS" : "PARTICIPANT ACCESS"}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {loginMode === "admin"
                ? "Authenticate as event administrator to manage the live CTF matrix"
                : "Sign in with your team account to enter the 24-hr CTF Arena"}
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-5 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginMode("participant");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold transition ${
                loginMode === "participant"
                  ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Participant</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("admin");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-semibold transition ${
                loginMode === "admin"
                  ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin / Staff</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                {loginMode === "admin" ? "Admin Username" : "Username or Email"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="login"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder={loginMode === "admin" ? "admin" : "hacker1 or team email"}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 mt-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                loginMode === "admin"
                  ? "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              } disabled:opacity-50`}
            >
              <span>{loading ? "Authenticating..." : loginMode === "admin" ? "Enter Command Center" : "Enter Arena"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {loginMode === "participant" ? (
            <div className="mt-6 pt-6 border-t border-slate-800 text-center font-mono text-xs text-slate-400">
              Don&apos;t have a team account yet?{" "}
              <Link href="/register" className="text-emerald-400 hover:underline font-semibold">
                Register team here
              </Link>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-slate-800 text-center font-mono text-[11px] text-slate-500">
              🔒 Restricted to authorized college CTF administrators and jury members.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
