"use client";

/**
 * PREVIEW ONLY — simulates the post-domain-mapping "embedded shell":
 * the portal rail stays, TalentLMS renders inside the content area.
 * Toggle between the two things a learner would actually see.
 */
import { useState } from "react";

function PlayerSim() {
  return (
    <div className="flex h-full flex-col bg-[#16181d]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#101216] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Profitable Service Advisor Training</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-slate-300">Lesson 2 of 14</span>
        </div>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[14%] rounded-full bg-emerald-500" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-lg bg-black shadow-2xl">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-7 w-7">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-[#101216] px-5 py-3">
        <span className="text-xs text-slate-400">Welcome To Profitable Service Advisor Training!</span>
        <button className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white">
          Complete &amp; continue →
        </button>
      </div>
    </div>
  );
}

function DashboardSim() {
  const items = ["Home", "Courses", "Learning paths", "Calendar", "Progress"];
  return (
    <div className="flex h-full bg-[#16181d]">
      {/* TalentLMS inner menu (the "second sidebar" — dark themed, skinny) */}
      <div className="w-44 shrink-0 border-r border-white/10 bg-[#101216] px-3 py-4">
        <div className="mb-4 px-2 text-xs font-bold tracking-wide text-white">
          CHRIS COLLINS <span className="text-gold-500">ON DEMAND</span>
        </div>
        {items.map((it, i) => (
          <div
            key={it}
            className={`rounded-md px-3 py-2 text-sm ${i === 0 ? "bg-white/10 text-white" : "text-slate-400"}`}
          >
            {it}
          </div>
        ))}
      </div>
      <div className="flex-1 p-8">
        <h2 className="text-xl font-bold text-white">Welcome, Mike!</h2>
        <div className="mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#101216] p-5">
            <p className="text-sm font-semibold text-white">My courses</p>
            <div className="mt-3 space-y-2">
              {["Profitable Service Advisor Training", "Car Doctor Clinic"].map((c) => (
                <div key={c} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="text-xs text-slate-300">{c}</span>
                  <span className="text-xs text-slate-500">Resume</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#101216] p-5">
            <p className="text-sm font-semibold text-white">Timeline</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              You signed in — 5 minutes ago
              <br />
              Lesson completed — 2 hours ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShellPreview() {
  const [view, setView] = useState<"player" | "dashboard">("player");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-900 px-6 py-2.5">
        <p className="text-xs text-slate-400">
          <span className="mr-2 rounded bg-gold-500/15 px-2 py-0.5 font-semibold text-gold-400">PREVIEW</span>
          The embedded shell after domain mapping — your rail stays, TalentLMS lives in this pane.
        </p>
        <div className="flex gap-1 rounded-lg border border-ink-700 p-0.5">
          <button
            onClick={() => setView("player")}
            className={`rounded-md px-3 py-1 text-xs font-medium ${view === "player" ? "bg-gold-500 text-ink-950" : "text-slate-400 hover:text-white"}`}
          >
            Course player
          </button>
          <button
            onClick={() => setView("dashboard")}
            className={`rounded-md px-3 py-1 text-xs font-medium ${view === "dashboard" ? "bg-gold-500 text-ink-950" : "text-slate-400 hover:text-white"}`}
          >
            TalentLMS dashboard
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{view === "player" ? <PlayerSim /> : <DashboardSim />}</div>
    </div>
  );
}
