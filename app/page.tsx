import Link from "next/link";

const pillars = [
  {
    title: "Proven Playbooks",
    body: "Courses built from decades in the service drive — not theory. Systems your team can run Monday morning.",
  },
  {
    title: "Train Anywhere",
    body: "Every course works on the shop floor, in the office, or at home. Progress syncs automatically.",
  },
  {
    title: "Coaching On Demand",
    body: "Ask questions and get answers drawn from Chris's books and podcasts — any time, mid-course or mid-shift.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">
          <span className="neon-sign">CHRIS COLLINS</span> <span className="neon-sign-gold">INC</span>
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#courses" className="text-slate-400 hover:text-white">Courses</a>
          <a href="#why" className="text-slate-400 hover:text-white">Why Us</a>
          <Link
            href="/login"
            className="rounded-md border border-gold-500/60 px-4 py-2 font-medium text-gold-400 transition hover:bg-gold-500 hover:text-ink-950"
          >
            Member Login
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold-500">
          The Training Academy
        </p>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white">
          Build a service department that <span className="neon-sign-gold">prints money</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Step-by-step training for service advisors, managers, and owners — from the team behind
          the industry&apos;s best-selling playbooks and podcasts.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#courses"
            className="rounded-md bg-gold-500 px-8 py-3 font-semibold text-ink-950 transition hover:bg-gold-400"
          >
            Explore Training
          </a>
          <Link
            href="/login"
            className="rounded-md border border-ink-700 px-8 py-3 font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section id="why" className="border-t border-ink-800 bg-ink-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-xl border border-ink-700 bg-ink-800 p-8">
              <h3 className="mb-3 text-lg font-bold text-white">{p.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="courses" className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white">Ready to get to work?</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Members get instant access to the full course library, certifications, and the AI coach.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-gold-500 px-10 py-3 font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          Member Login
        </Link>
      </section>

      <footer className="border-t border-ink-800 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Chris Collins Inc. All rights reserved.
      </footer>
    </main>
  );
}
