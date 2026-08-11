import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStandings } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const medal = ["🥇", "🥈", "🥉"];

function Initials({ name }: { name: string }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-gold-400">
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const standings = await getStandings();
  const top = standings.slice(0, 3);
  const rest = standings.slice(3);
  const myIndex = standings.findIndex((s) => s.id === session.userId);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Points come from training — completing lessons, courses, and showing up. Updated every few minutes.
      </p>
      {myIndex >= 0 && (
        <p className="mt-3 inline-block rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-sm font-semibold text-gold-400">
          Your rank: #{myIndex + 1} · {standings[myIndex].points.toLocaleString()} pts
        </p>
      )}

      {/* Podium */}
      {top.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {top.map((s, i) => (
            <div
              key={s.id}
              className={`rounded-xl border p-5 text-center ${
                i === 0 ? "border-gold-500/70 bg-gradient-to-b from-gold-500/10 to-ink-900" : "border-ink-700 bg-ink-900"
              } ${i === 0 ? "md:order-2" : i === 1 ? "md:order-1" : "md:order-3"}`}
            >
              <div className="text-3xl">{medal[i]}</div>
              <div className="mx-auto mt-2 flex justify-center">
                <Initials name={s.name} />
              </div>
              <p className="mt-2 truncate font-semibold text-white">{s.name}</p>
              <p className="text-xs text-slate-500">Level {s.level}</p>
              <p className={`mt-2 text-lg font-extrabold ${i === 0 ? "text-gold-400" : "text-slate-300"}`}>
                {s.points.toLocaleString()} pts
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Standings */}
      <ul className="mt-6 divide-y divide-ink-800 rounded-xl border border-ink-700 bg-ink-900">
        {rest.map((s, i) => {
          const rank = i + 4;
          const isMe = s.id === session.userId;
          return (
            <li
              key={s.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${isMe ? "bg-gold-500/10" : ""}`}
            >
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-500">#{rank}</span>
              <Initials name={s.name} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isMe ? "text-gold-400" : "text-white"}`}>
                  {s.name} {isMe && <span className="text-xs text-slate-500">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">Level {s.level}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-slate-300">{s.points.toLocaleString()}</span>
            </li>
          );
        })}
        {standings.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-slate-500">
            No standings yet — points appear as members train.
          </li>
        )}
      </ul>
    </div>
  );
}
