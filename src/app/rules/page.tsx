import Navbar from "@/components/Navbar";
import { ShieldAlert, BookOpen, Clock, Flame, Users, Ban, CheckCircle } from "lucide-react";

export default function RulesPage() {
  const rules = [
    {
      title: "1. No Collusion or Flag Sharing",
      icon: Users,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      description:
        "Sharing flags, solutions, or clues between different teams is strictly prohibited. Every submission is recorded with team identity, IP address, and timestamp. Suspected collusion will result in immediate disqualification.",
    },
    {
      title: "2. Do NOT Attack Platform Infrastructure",
      icon: Ban,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      description:
        "The scoreboard, challenge web server, and scoring APIs are OFF-LIMITS. Any attempt to perform Denial of Service (DoS/DDoS), fuzz the CTF platform, or tamper with other teams' accounts will result in an immediate permanent ban.",
    },
    {
      title: "3. Flag Submission & Rate Limiting",
      icon: ShieldAlert,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      description:
        "Flags strictly adhere to the format `CTF{...}` unless otherwise stated. Automated dictionary attacks and brute-forcing are rate-limited to 5 submissions per 30 seconds per challenge.",
    },
    {
      title: "4. First Blood Honor",
      icon: Flame,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      description:
        "The first team to solve an unlocked challenge claims 'First Blood' on the live scoreboard and broadcast feed.",
    },
    {
      title: "5. Tactical Hints & Penalties",
      icon: BookOpen,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      description:
        "Certain challenges offer progressive hints. Unlocking a hint deducts points from your team's total score. Hints are team-wide once unlocked.",
    },
    {
      title: "6. Tie-Breaking Protocol",
      icon: Clock,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      description:
        "In the event of a tie in total points, the team that achieved their final score first (earliest last submission timestamp) will be ranked higher.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-mono">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 mb-3">
            <span>OFFICIAL GUIDELINES</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            RULES OF ENGAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-2 max-w-lg mx-auto">
            All participants must abide by these ethical hacking regulations throughout the 24-hour contest.
          </p>
        </div>

        <div className="space-y-4">
          {rules.map((rule, idx) => {
            const Icon = rule.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg border ${rule.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{rule.title}</h3>
                </div>
                <p className="text-xs text-slate-400 pl-11 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="mt-8 p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
          <h4 className="text-sm font-bold text-white mb-1">Need Organizer Support?</h4>
          <p className="text-xs text-slate-400">
            Reach out to the college CTF coordination desk in the computer laboratory or through the official event channel.
          </p>
        </div>
      </main>
    </div>
  );
}
