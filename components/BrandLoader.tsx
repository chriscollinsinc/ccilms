/** Unified branded loading animation — used for course launches, SSO
 * handoffs, the AI coach, and internal page transitions. */
export default function BrandLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-2 border-ink-700" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#d9a233", animationDuration: "1.1s" }}
        />
        <div
          className="absolute inset-2 animate-spin rounded-full border border-transparent"
          style={{ borderBottomColor: "rgba(217,162,51,.45)", animationDuration: "1.6s", animationDirection: "reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold tracking-tight text-white">
          CC
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-white">
          CHRIS COLLINS <span className="text-gold-500">INC</span>
        </p>
        {label && <p className="mt-2 animate-pulse text-xs text-slate-500">{label}</p>}
      </div>
    </div>
  );
}
