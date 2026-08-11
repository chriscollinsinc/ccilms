"use client";

/**
 * Branded transition screen. Shows the Chris Collins loader, then hands the
 * browser to TalentLMS (course player or community SSO).
 *   /launch?course=126   -> /api/course/126/launch
 *   /launch?sso=1        -> /api/sso
 */
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BrandLoader from "@/components/BrandLoader";

function Inner() {
  const params = useSearchParams();
  const course = params.get("course");
  const sso = params.get("sso");

  const label = course ? "Loading your training…" : "Opening the community…";

  useEffect(() => {
    const target = course
      ? `/api/course/${encodeURIComponent(course)}/launch`
      : sso
        ? "/api/sso"
        : "/home";
    const t = setTimeout(() => {
      window.location.href = target;
    }, 900);
    return () => clearTimeout(t);
  }, [course, sso]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-950">
      <BrandLoader label={label} />
    </main>
  );
}

export default function LaunchPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ink-950" />}>
      <Inner />
    </Suspense>
  );
}
