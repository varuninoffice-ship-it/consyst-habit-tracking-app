import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        chalk: "var(--chalk)",
        border: "var(--border)",
        "border-md": "var(--border-md)",
        ink: "var(--ink)",
        stone: "var(--stone)",
        dust: "var(--dust)",
        coral: "var(--coral)",
        amber: "var(--amber)",
        teal: "var(--teal)",
        blue: "var(--blue)",
        purple: "var(--purple)",
        "teal-lt": "var(--teal-lt)",
        "amber-lt": "var(--amber-lt)",
        "coral-lt": "var(--coral-lt)",
        "blue-lt": "var(--blue-lt)",
        "purple-lt": "var(--purple-lt)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
        serif: ["Lora", "Georgia", "serif"],
      },
      letterSpacing: {
        tight: "-1.5px",
        eyebrow: "0.15em",
        label: "0.2em",
      },
    },
  },
  plugins: [],
};
export default config;
