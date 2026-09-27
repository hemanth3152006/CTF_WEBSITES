"use client";

import { useEffect, useState } from "react";
import { Clock, Pause, Play, AlertCircle } from "lucide-react";

interface TimerData {
  title: string;
  isPaused: boolean;
  remainingSeconds: number;
  isEnded: boolean;
  isFrozen: boolean;
}

export default function CountdownTimer() {
  const [timerData, setTimerData] = useState<TimerData>({
    title: "CTF",
    isPaused: false,
    remainingSeconds: 24 * 3600,
    isEnded: false,
    isFrozen: false,
  });

  const syncTimer = () => {
    fetch("/api/event/timer")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTimerData({
            title: data.title,
            isPaused: data.isPaused,
            remainingSeconds: data.remainingSeconds,
            isEnded: data.isEnded,
            isFrozen: data.isFrozen,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    syncTimer();
    // Sync with server every 10 seconds to stay aligned across all devices
    const serverSyncInterval = setInterval(syncTimer, 10000);

    // Local tick every second if running
    const localTickInterval = setInterval(() => {
      setTimerData((prev) => {
        if (prev.isPaused || prev.isEnded || prev.remainingSeconds <= 0) {
          return prev;
        }
        const nextSeconds = prev.remainingSeconds - 1;
        return {
          ...prev,
          remainingSeconds: nextSeconds,
          isEnded: nextSeconds <= 0,
        };
      });
    }, 1000);

    return () => {
      clearInterval(serverSyncInterval);
      clearInterval(localTickInterval);
    };
  }, []);

  const totalSec = Math.max(0, timerData.remainingSeconds);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (timerData.isPaused) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Pause className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="uppercase text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">
          PAUSED
        </span>
        <span>
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    );
  }

  if (timerData.isEnded) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.2)]">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        <span className="uppercase">CONTEST ENDED</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-sm font-semibold tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)]">
      <Clock className="w-4 h-4 animate-pulse text-emerald-400" />
      <span>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
      {timerData.isFrozen && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          ❄️ FROZEN
        </span>
      )}
    </div>
  );
}
