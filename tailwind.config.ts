import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        evolya: {
          navy: "#0D1F3C",
          "navy-mid": "#162847",
          green: "#4E9B6F",
          "green-dark": "#3d8058",
          "green-light": "#EEF9F3",
          bg: "#F8FAFB",
          card: "#FFFFFF",
          border: "#E2E8F0",
          text: "#0D1F3C",
          muted: "#64748B",
          subtle: "#94A3B8",
          warning: "#D4A853",
        },
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "10px",
        md: "8px",
        sm: "6px",
        DEFAULT: "10px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.04)",
        sm: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        DEFAULT: "0 2px 6px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        md: "0 4px 12px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)",
        lg: "0 8px 24px -4px rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.04)",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "1.4" }],
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["13.5px", { lineHeight: "1.55" }],
        base: ["15px", { lineHeight: "1.6" }],
        lg: ["17px", { lineHeight: "1.5" }],
        xl: ["19px", { lineHeight: "1.4" }],
        "2xl": ["22px", { lineHeight: "1.35" }],
        "3xl": ["28px", { lineHeight: "1.25" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
