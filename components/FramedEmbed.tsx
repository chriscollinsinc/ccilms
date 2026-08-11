"use client";

import { useState } from "react";
import BrandLoader from "@/components/BrandLoader";

/** Iframe with the branded loader overlaid until the embed finishes loading. */
export default function FramedEmbed({
  src,
  title,
  allow,
  label,
}: {
  src: string;
  title: string;
  allow?: string;
  label?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full flex-1 bg-ink-950">
      <iframe
        src={src}
        title={title}
        allow={allow}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full border-0"
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-950 transition-opacity duration-700"
        style={{ opacity: loaded ? 0 : 1 }}
      >
        <BrandLoader label={label} />
      </div>
    </div>
  );
}
