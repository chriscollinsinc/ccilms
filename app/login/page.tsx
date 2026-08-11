"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-lg font-bold tracking-tight">
          <span className="neon-sign">CHRIS COLLINS</span> <span className="neon-sign-gold">INC</span>
        </Link>
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-ink-700 bg-ink-900 p-8 shadow-2xl"
        >
          <h1 className="mb-6 text-xl font-bold text-white">Member Login</h1>

          <label className="mb-1 block text-sm text-slate-400" htmlFor="login">
            Username or email
          </label>
          <input
            id="login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete="username"
            className="mb-4 w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-white outline-none focus:border-gold-500"
          />

          <label className="mb-1 block text-sm text-slate-400" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mb-6 w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-white outline-none focus:border-gold-500"
          />

          {error && (
            <p className="mb-4 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-gold-500 py-2.5 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-600">
          Trouble signing in? Contact your account manager.
        </p>
      </div>
    </main>
  );
}
