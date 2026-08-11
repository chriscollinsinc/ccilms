"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled portal error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-white">
        CHRIS COLLINS <span className="text-gold-500">INC</span>
      </p>
      <h1 className="mt-8 text-4xl font-extrabold text-white">Something broke.</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-400">
        That&apos;s on us, not you. Try again — if it keeps happening, ping your account manager.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate-600">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-ink-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-gold-500/50 hover:text-white"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
