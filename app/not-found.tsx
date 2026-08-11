import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-white">
        CHRIS COLLINS <span className="text-gold-500">INC</span>
      </p>
      <h1 className="mt-8 text-6xl font-extrabold text-gold-500">404</h1>
      <p className="mt-3 text-lg font-semibold text-white">This page took a wrong turn.</p>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-md border border-ink-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-gold-500/50 hover:text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
