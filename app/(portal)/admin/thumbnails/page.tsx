"use client";

/**
 * Thumbnail Studio — generates on-brand 1280x720 course thumbnails.
 * Everything is drawn on canvas; Export downloads a PNG ready for TalentLMS.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const W = 1280;
const H = 720;
const GOLD = "#d9a233";
const INK = "#0a0e14";
const INK2 = "#131a26";

type Variant = "ink" | "gold" | "neon" | "photo";
const NEON = "#ff8c1a";

function fitTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): { size: number; lines: string[] } {
  for (let size = 104; size >= 44; size -= 4) {
    ctx.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (ctx.measureText(probe).width <= maxWidth) line = probe;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= 3 && lines.every((l) => ctx.measureText(l).width <= maxWidth)) {
      return { size, lines };
    }
  }
  return { size: 44, lines: [text] };
}

export default function ThumbnailStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState("Profitable Service Advisor Training");
  const [track, setTrack] = useState("SERVICE ADVISORS");
  const [level, setLevel] = useState("");
  const [variant, setVariant] = useState<Variant>("ink");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // NEON — service-shop sign on a dark wall
    if (variant === "neon") {
      ctx.textAlign = "left";
      ctx.fillStyle = "#0b0908";
      ctx.fillRect(0, 0, W, H);

      // Brick wall hint
      ctx.strokeStyle = "rgba(255,255,255,.045)";
      ctx.lineWidth = 2;
      for (let y = 0; y < H; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        const offset = (y / 46) % 2 === 0 ? 0 : 60;
        for (let x = offset; x < W; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 46);
          ctx.stroke();
        }
      }
      // Warm glow vignette
      const rg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.72);
      rg.addColorStop(0, "rgba(255,140,26,.10)");
      rg.addColorStop(1, "rgba(0,0,0,.7)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      // Neon title (orange tubes)
      const { size, lines } = fitTitle(ctx, (title.trim() || "Course Title").toUpperCase(), W - 260);
      ctx.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
      const lineHeight = size * 1.18;
      const blockH = lines.length * lineHeight;
      let y = (H - blockH) / 2 + size * 0.8;
      for (const line of lines) {
        ctx.save();
        ctx.shadowColor = NEON;
        ctx.shadowBlur = 55;
        ctx.strokeStyle = NEON;
        ctx.lineWidth = 10;
        ctx.strokeText(line, W / 2, y);
        ctx.strokeText(line, W / 2, y);
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "#ffb14d";
        ctx.lineWidth = 5;
        ctx.strokeText(line, W / 2, y);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fff3df";
        ctx.lineWidth = 2;
        ctx.strokeText(line, W / 2, y);
        ctx.fillStyle = "rgba(255,140,26,.22)";
        ctx.fillText(line, W / 2, y);
        ctx.restore();
        y += lineHeight;
      }

      // Track chip — white neon outline box above the title
      if (track.trim()) {
        const label = track.trim().toUpperCase() + (level.trim() ? ` · LEVEL ${level.trim()}` : "");
        ctx.font = "700 32px system-ui, -apple-system, sans-serif";
        const tw = ctx.measureText(label).width;
        const bx = W / 2 - tw / 2 - 28;
        const by = (H - blockH) / 2 - 96;
        ctx.save();
        ctx.shadowColor = "#dbeafe";
        ctx.shadowBlur = 26;
        ctx.strokeStyle = "#f6f9ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + 56, 62, 10);
        ctx.stroke();
        ctx.fillStyle = "#f6f9ff";
        ctx.textBaseline = "middle";
        ctx.fillText(label, W / 2, by + 33);
        ctx.restore();
        ctx.textBaseline = "alphabetic";
      }

      // Brand — small white neon, bottom center
      ctx.save();
      ctx.font = "700 30px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#f6f9ff";
      ctx.fillText("CHRIS COLLINS INC", W / 2, H - 56);
      ctx.restore();
      ctx.textAlign = "left";
      return;
    }

    // Background
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    if (variant === "photo" && photo) {
      const scale = Math.max(W / photo.width, H / photo.height);
      const dw = photo.width * scale;
      const dh = photo.height * scale;
      ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(10,14,20,.96)");
      g.addColorStop(0.55, "rgba(10,14,20,.78)");
      g.addColorStop(1, "rgba(10,14,20,.25)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else if (variant === "gold") {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#3d2f0e");
      g.addColorStop(0.5, INK2);
      g.addColorStop(1, INK);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(217,162,51,.14)";
      ctx.lineWidth = 2;
      for (let x = -H; x < W + H; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + H, H);
        ctx.stroke();
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, INK2);
      g.addColorStop(1, INK);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148,163,184,.07)";
      ctx.lineWidth = 2;
      for (let x = -H; x < W + H; x += 56) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + H, H);
        ctx.stroke();
      }
    }

    // Gold accent bar
    ctx.fillStyle = GOLD;
    ctx.fillRect(0, 0, 14, H);

    const left = 84;

    // Track + level chips
    let chipX = left;
    const chipY = 96;
    const drawChip = (text: string, filled: boolean) => {
      ctx.font = "700 26px system-ui, -apple-system, sans-serif";
      const w = ctx.measureText(text).width + 44;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, w, 52, 26);
      if (filled) {
        ctx.fillStyle = GOLD;
        ctx.fill();
        ctx.fillStyle = INK;
      } else {
        ctx.strokeStyle = "rgba(217,162,51,.7)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = GOLD;
      }
      ctx.textBaseline = "middle";
      ctx.fillText(text, chipX + 22, chipY + 28);
      chipX += w + 16;
    };
    if (track.trim()) drawChip(track.trim().toUpperCase(), true);
    if (level.trim()) drawChip(`LEVEL ${level.trim()}`, false);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "alphabetic";
    const { size, lines } = fitTitle(ctx, title.trim() || "Course Title", W - left - 120);
    ctx.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
    const lineHeight = size * 1.12;
    const blockH = lines.length * lineHeight;
    let y = (H - blockH) / 2 + size * 0.85 + 30;
    for (const line of lines) {
      ctx.fillText(line, left, y);
      y += lineHeight;
    }

    // Brand footer
    ctx.font = "700 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    const brand = "CHRIS COLLINS ";
    ctx.fillText(brand, left, H - 72);
    ctx.fillStyle = GOLD;
    ctx.fillText("INC", left + ctx.measureText(brand).width, H - 72);

    // Gold underline under title block
    ctx.fillStyle = GOLD;
    ctx.fillRect(left, H - 128, 120, 6);
  }, [title, track, level, variant, photo]);

  useEffect(() => {
    draw();
  }, [draw]);

  function onPhoto(file: File | null) {
    if (!file) return setPhoto(null);
    const img = new Image();
    img.onload = () => {
      setPhoto(img);
      setVariant("photo");
    };
    img.src = URL.createObjectURL(file);
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(title || "thumbnail").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Thumbnail Studio</h1>
          <p className="mt-1 text-sm text-slate-400">
            On-brand course art, exported at 1280×720 — upload the PNG as the course image in TalentLMS.
          </p>
        </div>
        <button
          onClick={exportPng}
          className="rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
        >
          Export PNG
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr,320px]">
        {/* Preview */}
        <div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full rounded-xl border border-ink-700 shadow-2xl"
          />
          <p className="mt-2 text-xs text-slate-600">Live preview — exactly what exports.</p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Course title</span>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-gold-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Track label (chip)</span>
            <input
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              placeholder="SERVICE ADVISORS"
              className="w-full rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Level (optional)</span>
            <input
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              placeholder="1"
              className="w-24 rounded-md border border-ink-700 bg-ink-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-500"
            />
          </label>
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-400">Style</span>
            <div className="flex gap-2">
              {(["ink", "gold", "neon", "photo"] as Variant[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  disabled={v === "photo" && !photo}
                  className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition disabled:opacity-40 ${
                    variant === v
                      ? "bg-gold-500 text-ink-950"
                      : "border border-ink-700 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Background photo (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-ink-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-ink-800"
            />
            <span className="mt-1 block text-xs text-slate-600">
              Photos get the dark gradient treatment automatically so text stays readable.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
