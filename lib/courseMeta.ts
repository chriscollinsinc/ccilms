/**
 * Conventions read from TalentLMS course fields.
 * Course code like "SA-101" or "MGR201" => level 1 / 2 (first digit of the
 * 3-digit number). Codes also drive ordering within a shelf.
 */

export function courseLevel(code?: string): number | null {
  const m = code?.match(/(\d{3})/);
  if (!m) return null;
  const level = Math.floor(Number(m[1]) / 100);
  return level >= 1 ? level : null; // "001"-style codes aren't levels
}

export function codeSort(a?: string, b?: string, nameA?: string, nameB?: string): number {
  if (a && b && a !== b) return a.localeCompare(b, undefined, { numeric: true });
  if (a && !b) return -1;
  if (!a && b) return 1;
  return (nameA ?? "").localeCompare(nameB ?? "");
}

export function stripHtml(html?: string): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * TalentLMS serves a bright default image (rb_unknown / course_default) for
 * courses with no uploaded artwork. Treat those as "no image" so cards fall
 * back to the dark branded thumb instead of a wall of beige placeholders.
 */
export function realImage(url?: string): string | undefined {
  if (!url) return undefined;
  if (/rb_unknown|course_default|\/images\/defaults\//i.test(url)) return undefined;
  return url;
}
