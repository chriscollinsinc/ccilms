"use client";

import { useEffect } from "react";

/** Catches errors that escape the root layout itself (rare) — must render its own html/body. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0907",
            color: "#fff",
            textAlign: "center",
            padding: "0 24px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.2em" }}>
            CHRIS COLLINS <span style={{ color: "#d9a233" }}>INC</span>
          </p>
          <h1 style={{ marginTop: 32, fontSize: 36, fontWeight: 800 }}>Something broke.</h1>
          <p style={{ marginTop: 12, maxWidth: 360, fontSize: 14, color: "#94a3b8" }}>
            That&apos;s on us, not you. Try reloading — if it keeps happening, ping your account manager.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 32,
              borderRadius: 6,
              background: "#d9a233",
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              color: "#0b0907",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
