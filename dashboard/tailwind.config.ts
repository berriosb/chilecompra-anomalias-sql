import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta editorial sobria (mismo estilo que las PNGs)
        ink: {
          DEFAULT: "#1a1a1a",
          muted: "#8a8580",
          subtle: "#b5b0aa",
        },
        paper: "#fdfcfa",
        accent: {
          DEFAULT: "#c1502e",  // warm orange (Chile mining)
          hover: "#a8421f",
        },
        grid: "#e8e6e1",
        // Niveles HHI
        hhi: {
          low: "#4a7c59",
          mid: "#d4a437",
          high: "#c1502e",
        },
        // Tier badges
        bg: {
          default: "#ffffff",
          subtle: "#faf9f5",
          hover: "#f5f3ed",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
