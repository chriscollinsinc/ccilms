"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminTabs({ showPeople }: { showPeople: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/spotlight", label: "Spotlight" },
    { href: "/admin/podcast", label: "Podcast" },
    { href: "/admin/resources", label: "Resources" },
    { href: "/admin/tools", label: "Tools" },
    { href: "/admin/coach", label: "AI Coach" },
    { href: "/admin/thumbnails", label: "Thumbnails" },
    // Board moderation + People are admin-only (showPeople === admin).
    ...(showPeople ? [{ href: "/admin/board", label: "Board" }, { href: "/admin/people", label: "People" }] : []),
  ];

  return (
    <nav className="mt-3 flex gap-1">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
              active ? "border-gold-500 text-gold-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
