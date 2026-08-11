/** Thread tag taxonomy — shared client + server. Literal class strings so
 *  Tailwind keeps them in the build. */
export interface TagDef {
  id: string;
  label: string;
  badge: string; // badge bg + text
  ring: string; // left-border accent color
}

export const THREAD_TAGS: TagDef[] = [
  { id: "announcement", label: "Official Announcement", badge: "bg-gold-500 text-ink-950", ring: "border-l-gold-500" },
  { id: "homework", label: "Homework", badge: "bg-sky-900/60 text-sky-300", ring: "border-l-sky-500" },
  { id: "academy", label: "Academy", badge: "bg-purple-900/60 text-purple-300", ring: "border-l-purple-500" },
  { id: "question", label: "Question", badge: "bg-teal-900/60 text-teal-300", ring: "border-l-teal-500" },
  { id: "win", label: "Win", badge: "bg-emerald-900/60 text-emerald-300", ring: "border-l-emerald-500" },
];

export function tagById(id?: string): TagDef | null {
  return THREAD_TAGS.find((t) => t.id === id) ?? null;
}
