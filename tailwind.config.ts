import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand neutrals — near-black base, refined instead of "grungy night shop"
        ink: {
          950: "#000005",
          900: "#0d0d12",
          800: "#16161c",
          700: "#26262e",
        },
        // Primary brand accent (--e-global-color-primary / -2697223)
        gold: {
          // kept the "gold" name so every existing className keeps working —
          // values now point at the brand's actual primary orange, not a
          // literal gold, since it's the one color used everywhere (links,
          // active nav, progress, borders).
          400: "#F15F43",
          500: "#F15F43",
          600: "#A6422E", // --e-global-color-c9a1993 — hover/pressed shade
        },
        // Reserved strictly for primary CTA buttons (--e-global-color-accent)
        accent: {
          400: "#FAC359",
          500: "#FAC359",
          600: "#dba847",
        },
        // Success / "completed" state (--e-global-color-445f36d / -42ffec3)
        done: {
          400: "#74B666",
          500: "#74B666",
          600: "#2C4D25",
        },
        // Neutral text scale (--e-global-color-5139ee38 / -618946a / -39df2738)
        stone: {
          300: "#C1C1C1",
          500: "#7C7C7C",
          700: "#404040",
        },
      },
      fontFamily: {
        // Body copy — quiet and readable at small sizes
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
        // Headlines, nav labels, buttons, section titles — the brand's display font
        display: ["Oswald", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
