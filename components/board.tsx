"use client";

/** Shared discussion-board UI pieces. */
import { useRef, useState } from "react";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const isImg = (t: string) => t.startsWith("image/");

/** Attach button — uploads on select, reports uploaded attachment metadata up. */
export function AttachmentPicker({
  attachments,
  onChange,
}: {
  attachments: Attachment[];
  onChange: (a: Attachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    const next = [...attachments];
    for (const file of Array.from(files).slice(0, 5)) {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/board/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.attachment) next.push(data.attachment);
      else setErr(data.error ?? "Upload failed.");
    }
    onChange(next.slice(0, 5));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {busy ? "Uploading…" : "Attach files"}
        </button>
        <span className="text-xs text-slate-600">PDF, Word, Excel, images · 20MB max · up to 5</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={(e) => pick(e.target.files)}
          className="hidden"
        />
      </div>
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span key={a.id} className="flex items-center gap-2 rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1 text-xs text-slate-300">
              <span className="max-w-[180px] truncate">{a.name}</span>
              <span className="text-slate-600">{fmtSize(a.size)}</span>
              <button
                type="button"
                onClick={() => onChange(attachments.filter((x) => x.id !== a.id))}
                aria-label="Remove"
                className="text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render a post's attachments: image thumbnails + document download chips. */
export function AttachmentList({ attachments }: { attachments?: Attachment[] }) {
  if (!attachments?.length) return null;
  const images = attachments.filter((a) => isImg(a.type));
  const docs = attachments.filter((a) => !isImg(a.type));
  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a) => (
            <a key={a.id} href={`/api/board/file/${a.id}`} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/board/file/${a.id}`} alt={a.name} className="h-28 w-28 rounded-lg border border-ink-700 object-cover transition hover:border-gold-500/50" />
            </a>
          ))}
        </div>
      )}
      {docs.map((a) => (
        <a
          key={a.id}
          href={`/api/board/file/${a.id}`}
          className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-sm transition hover:border-gold-500/50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0 text-gold-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0 flex-1 truncate text-slate-200">{a.name}</span>
          <span className="shrink-0 text-xs text-slate-500">{fmtSize(a.size)} · Download</span>
        </a>
      ))}
    </div>
  );
}

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Render post text: paragraphs preserved, @mentions in gold. */
export function PostBody({ body }: { body: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
      {body.split(/(@[A-Za-z][\w.-]*)/g).map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-semibold text-gold-400">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

/** Textarea with @mention autocomplete (insert as @FirstLast). */
export function MentionComposer({
  value,
  onChange,
  members,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  members: string[];
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function refresh(v: string, caret: number) {
    const upToCaret = v.slice(0, caret);
    const m = upToCaret.match(/@([\w.-]*)$/);
    if (!m) return setSuggestions([]);
    const q = m[1].toLowerCase();
    setSuggestions(
      members
        .filter((name) => name.replace(/\s+/g, "").toLowerCase().startsWith(q) || name.toLowerCase().startsWith(q))
        .slice(0, 5)
    );
  }

  function insert(name: string) {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart;
    const upToCaret = value.slice(0, caret).replace(/@[\w.-]*$/, `@${name.replace(/\s+/g, "")} `);
    const next = upToCaret + value.slice(caret);
    onChange(next);
    setSuggestions([]);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(upToCaret.length, upToCaret.length);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          refresh(e.target.value, e.target.selectionStart);
        }}
        onKeyUp={(e) => refresh(value, e.currentTarget.selectionStart)}
        className="w-full resize-y rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
      />
      {suggestions.length > 0 && (
        <div className="absolute left-2 top-full z-20 -mt-1 w-64 overflow-hidden rounded-lg border border-ink-700 bg-ink-900 shadow-2xl">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => insert(name)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-ink-800 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-700 text-[10px] font-semibold text-gold-400">
                {initials(name)}
              </span>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
