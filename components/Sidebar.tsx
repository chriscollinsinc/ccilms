"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/home", label: "Home", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" },
  { href: "/dashboard", label: "My Courses", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" },
  { href: "/library", label: "Course Library", icon: "M3 5h18M3 12h18M3 19h18" },
  { href: "/community", label: "Community Board", icon: "M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a2 2 0 0 1-2-2v-1M3 4h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4v-4H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" },
  { href: "/leaderboard", label: "Leaderboard", icon: "M8 21h8m-4-4v4m-6-17h12v4a6 6 0 0 1-12 0V4Zm12 2h2a2 2 0 0 1 2 2c0 2-2 3-4 3M6 6H4a2 2 0 0 0-2 2c0 2 2 3 4 3" },
  { href: "/podcast", label: "SDR Podcast", icon: "M12 2a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Zm7 10a7 7 0 0 1-14 0M12 19v3" },
  { href: "/coach", label: "Ask Chris (AI)", icon: "M8 10h8M8 14h4m9-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { href: "/resources", label: "Resources", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6" },
  { href: "/tools", label: "Tools", icon: "M14.7 6.3a4.5 4.5 0 0 0-6.1 5.9L2 18.8V22h3.2l6.6-6.6a4.5 4.5 0 0 0 5.9-6.1l-3 3-2.1-.7-.7-2.1 2.8-3.2Z" },
];

const adminItem = { href: "/admin/spotlight", label: "Admin Console", icon: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" };

const ITEM_H = 40; // px
const ITEM_GAP = 4; // px

export default function Sidebar({ userName, isAdmin = false }: { userName: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = isAdmin ? [...items, adminItem] : items;
  const activeIndex = navItems.findIndex((i) =>
    i.href.startsWith("/admin") ? pathname.startsWith("/admin") : pathname.startsWith(i.href)
  );

  return (
    // Layout reserves a fixed 64px column; the rail itself expands OVER the
    // content so nothing reflows.
    <div className="relative z-40 w-16 shrink-0">
      <aside
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-ink-800 bg-ink-900"
        style={{
          width: open ? 224 : 64,
          transition: "width 260ms cubic-bezier(.4,0,.2,1)",
          boxShadow: open ? "10px 0 32px rgba(0,0,0,.5)" : "none",
        }}
      >
        {/* Logo */}
        <Link href="/home" className="flex h-15 shrink-0 items-center whitespace-nowrap border-b border-ink-800 pl-5 text-sm font-bold tracking-tight" style={{ height: 60 }}>
          <span className="neon-sign">CC</span>
          <span
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(-6px)",
              transition: "opacity 250ms ease 80ms, transform 250ms ease 80ms",
            }}
          >
            <span className="neon-sign">&nbsp;— CHRIS COLLINS&nbsp;</span>
            <span className="neon-sign-gold">INC</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="relative flex-1 px-2.5 pt-3">
          {/* Sliding active indicator — flat, no glow/bounce */}
          {activeIndex >= 0 && (
            <span
              aria-hidden
              className="absolute left-2.5 right-2.5 rounded border-l-2 border-gold-500 bg-gold-500/[0.08]"
              style={{
                height: ITEM_H,
                top: activeIndex * (ITEM_H + ITEM_GAP),
                transition: "top 320ms cubic-bezier(.4,0,.2,1)",
              }}
            />
          )}
          <ul className="relative flex flex-col" style={{ gap: ITEM_GAP }}>
            {navItems.map((item, i) => {
              const active = i === activeIndex;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 whitespace-nowrap rounded px-3 font-display text-xs font-medium uppercase tracking-wide transition-colors ${
                      active ? "text-gold-500" : "text-slate-400 hover:text-white"
                    }`}
                    style={{ height: ITEM_H }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-[17px] w-[17px] shrink-0 transition-transform duration-150 group-hover:-translate-y-[1.5px] ${
                        active ? "text-gold-500" : "text-slate-500 group-hover:text-slate-200"
                      }`}
                    >
                      <path d={item.icon} />
                    </svg>
                    <span
                      style={{
                        opacity: open ? 1 : 0,
                        transform: open ? "translateX(0)" : "translateX(-6px)",
                        transition: `opacity 200ms ease ${60 + i * 20}ms, transform 200ms ease ${60 + i * 20}ms`,
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / sign out */}
        <div className="plate shrink-0 border-t border-ink-800 p-3">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gold-500 font-display text-[11px] font-bold text-ink-950">
              {userName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-between gap-2"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "translateX(0)" : "translateX(-6px)",
                transition: "opacity 250ms ease 120ms, transform 250ms ease 120ms",
              }}
            >
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <form action="/api/auth/logout" method="POST">
                <button
                  title="Sign out"
                  className="rounded-md border border-ink-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
