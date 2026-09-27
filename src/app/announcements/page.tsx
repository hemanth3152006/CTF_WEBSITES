"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Radio, Pin, Search, Bell, Clock, ShieldAlert } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPinned, setFilterPinned] = useState(false);

  const fetchAnnouncements = () => {
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.announcements) {
          setAnnouncements(data.announcements);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      const matchFilter = !filterPinned || a.isPinned;
      const matchSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [announcements, search, filterPinned]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-mono">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                EVENT BROADCASTS
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Official organizer transmissions, challenge releases, and system bulletins.
            </p>
          </div>

          {/* Search & Pinned Toggle */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterPinned(!filterPinned)}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                filterPinned
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pinned Only</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bulletins..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-900/60 rounded-xl border border-slate-800" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800/60 rounded-xl">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm text-slate-400">No broadcasts found.</div>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-xl border transition shadow-lg ${
                  item.isPinned
                    ? "bg-rose-950/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <Pin className="w-3 h-3" /> PINNED BULLETIN
                      </span>
                    )}
                    <h3 className="font-bold text-base text-white">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-0 sm:pl-1">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
