import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm "garage at night" neutrals — asphalt, oil, worn steel
        ink: {
          950: "#0b0907",
          900: "#131009",
          800: "#1c1610",
          700: "#2e251a",
        },
        gold: {
          400: "#e8b64c",
          500: "#d9a233",
          600: "#b9861f",
        },
        neon: {
          400: "#ffb14d",
          500: "#ff8c1a",
          600: "#e07714",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
