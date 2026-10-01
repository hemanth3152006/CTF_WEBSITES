"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
}

export default function AnnouncementStrip() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = () => {
      fetch("/api/announcements")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.announcements) {
            setAnnouncements(data.announcements.slice(0, 2));
          }
        })
        .catch(() => undefined);
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        <Bell className="w-4 h-4 text-rose-400 shrink-0" />
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {announcements.length === 0 ? (
            <span className="text-xs font-mono text-slate-500">No active announcements</span>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="min-w-0 flex items-center gap-1.5 text-xs font-mono">
                {announcement.isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                <span className="font-bold text-white truncate">{announcement.title}</span>
                <span className="hidden sm:inline text-slate-400 truncate max-w-xs">{announcement.content}</span>
              </div>
            ))
          )}
        </div>
        <Link href="/announcements" className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 shrink-0">
          VIEW ALL
        </Link>
      </div>
    </div>
  );
}
