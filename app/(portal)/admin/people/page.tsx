"use client";

import { useEffect, useMemo, useState } from "react";

interface Person {
  login: string;
  email: string;
  name: string;
  builtinAdmin: boolean;
}

export default function PeopleAdmin() {
  const [users, setUsers] = useState<Person[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [managers, setManagers] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error" | "saving" | "saved">("loading");

  useEffect(() => {
    fetch("/api/admin/roles")
      .then(async (r) => {
        if (r.status === 403) return setState("denied");
        const data = await r.json();
        setUsers(data.users ?? []);
        setAdmins(data.admins ?? []);
        setManagers(data.managers ?? []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  async function save(nextAdmins: string[], nextManagers: string[]) {
    setAdmins(nextAdmins);
    setManagers(nextManagers);
    setState("saving");
    const r = await fetch("/api/admin/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admins: nextAdmins, managers: nextManagers }),
    });
    setState(r.ok ? "saved" : "error");
    if (r.ok) setTimeout(() => setState("ready"), 1500);
  }

  const keyOf = (p: Person) => (p.login || p.email).toLowerCase();
  const roleOf = (p: Person): "builtin" | "admin" | "manager" | "learner" => {
    if (p.builtinAdmin) return "builtin";
    const ids = [p.login?.toLowerCase(), p.email?.toLowerCase()];
    if (admins.some((a) => ids.includes(a))) return "admin";
    if (managers.some((m) => ids.includes(m))) return "manager";
    return "learner";
  };

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.name} ${u.login} ${u.email}`.toLowerCase().includes(q.toLowerCase())
      ),
    [users, q]
  );

  const clearRoles = (p: Person) => {
    const ids = [p.login?.toLowerCase(), p.email?.toLowerCase()];
    return {
      admins: admins.filter((a) => !ids.includes(a)),
      managers: managers.filter((m) => !ids.includes(m)),
    };
  };

  if (state === "loading") return <div className="p-10 text-sm text-slate-400">Loading…</div>;
  if (state === "denied")
    return <div className="p-10 text-sm text-slate-400">Only admins can manage people.</div>;

  const badge = {
    builtin: <span className="rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-400">Admin (TalentLMS)</span>,
    admin: <span className="rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-semibold text-gold-400">Admin</span>,
    manager: <span className="rounded-full bg-sky-900/50 px-2.5 py-0.5 text-xs font-semibold text-sky-300">Manager</span>,
    learner: <span className="rounded-full bg-ink-700 px-2.5 py-0.5 text-xs text-slate-400">Member</span>,
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">People</h1>
          <p className="mt-1 text-sm text-slate-400">
            Admins manage everything including people. Managers edit content only.
          </p>
        </div>
        <div className="text-sm">
          {state === "saving" && <span className="text-slate-400">Saving…</span>}
          {state === "saved" && <span className="text-emerald-400">Saved ✓</span>}
          {state === "error" && <span className="text-red-400">Save failed</span>}
        </div>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search members…"
        className="mt-6 w-72 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-gold-500"
      />

      <ul className="mt-4 divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
        {filtered.map((p) => {
          const role = roleOf(p);
          const key = keyOf(p);
          return (
            <li key={key} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gold-400">
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{p.name || p.login}</p>
                <p className="truncate text-xs text-slate-500">{p.email || p.login}</p>
              </div>
              {badge[role]}
              {role !== "builtin" && (
                <div className="flex shrink-0 gap-2">
                  {role !== "admin" && (
                    <button
                      onClick={() => {
                        const c = clearRoles(p);
                        save([...c.admins, key], c.managers);
                      }}
                      className="rounded-md border border-gold-500/50 px-3 py-1 text-xs font-semibold text-gold-400 hover:bg-gold-500 hover:text-ink-950"
                    >
                      Make admin
                    </button>
                  )}
                  {role !== "manager" && (
                    <button
                      onClick={() => {
                        const c = clearRoles(p);
                        save(c.admins, [...c.managers, key]);
                      }}
                      className="rounded-md border border-sky-700 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-800/50"
                    >
                      Make manager
                    </button>
                  )}
                  {role !== "learner" && (
                    <button
                      onClick={() => {
                        const c = clearRoles(p);
                        save(c.admins, c.managers);
                      }}
                      className="rounded-md border border-ink-700 px-3 py-1 text-xs text-slate-400 hover:border-red-800 hover:text-red-400"
                    >
                      Remove role
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-slate-500">No members match.</li>
        )}
      </ul>

      <p className="mt-4 text-xs text-slate-600">
        Accounts marked &quot;Admin (TalentLMS)&quot; are admin-type users in TalentLMS itself and always
        have full access — manage those in TalentLMS.
      </p>
    </div>
  );
}
