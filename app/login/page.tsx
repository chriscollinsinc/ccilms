"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    if (res.ok) {
      router.push("/home");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed. Check your username and password.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {/* White card, square corners, orange top rule — matches the Coach
          Fulfillment System login so the internal tools read as one suite. */}
      <div className="w-full max-w-[400px] border-t-4 border-gold-500 bg-white px-9 py-10 shadow-2xl">
        <p className="font-display text-sm font-bold uppercase tracking-tight text-[#111]">
          Chris Collins <span className="text-gold-500">Inc</span>
        </p>
        <h1 className="mb-7 mt-1 font-display text-xl font-bold uppercase text-[#111]">
          Member Login
        </h1>

        <form onSubmit={onSubmit}>
          <label
            className="mb-1 block font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500"
            htmlFor="login"
          >
            Username or email
          </label>
          <input
            id="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete="username"
            className="mb-4 w-full rounded-[2px] border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-gold-500"
          />

          <label
            className="mb-1 block font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mb-6 w-full rounded-[2px] border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-gold-500"
          />

          {error && (
            <p className="mb-4 rounded-[2px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[2px] bg-accent-500 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-[#16130a] transition hover:bg-accent-600 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-stone-500">
          Trouble signing in? <span className="font-medium text-gold-600">Contact your account manager.</span>
        </p>
      </div>
    </main>
  );
}
