/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F3EEE4",
          raised: "#FAF6EF",
          inset: "#EBE4D8",
        },
        ink: {
          DEFAULT: "#1C1917",
          muted: "#57534E",
          faint: "#A8A29E",
        },
        line: {
          DEFAULT: "#DDD4C6",
          strong: "#C9BDAA",
        },
        moss: {
          50: "#F4F6F1",
          100: "#E4EBE0",
          200: "#C9D6C2",
          300: "#A3B896",
          400: "#7A9670",
          500: "#5C7A54",
          600: "#3F5D4A",
          700: "#344C3D",
          800: "#2A3D32",
          900: "#1F2E26",
          950: "#141F1A",
        },
        clay: {
          50: "#FBF4EE",
          100: "#F3E4D6",
          400: "#D4895A",
          500: "#C46B3A",
          600: "#A85A2E",
          700: "#8B4A26",
        },
        eco: {
          50: "#F4F6F1",
          100: "#E4EBE0",
          200: "#C9D6C2",
          300: "#A3B896",
          400: "#7A9670",
          500: "#5C7A54",
          600: "#3F5D4A",
          700: "#344C3D",
          800: "#2A3D32",
          900: "#1F2E26",
          950: "#141F1A",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ['"Fraunces"', "Georgia", "Times New Roman", "serif"],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "display-lg": [
          "3.25rem",
          { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-md": [
          "2.25rem",
          { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "600" },
        ],
      },
      boxShadow: {
        notebook:
          "0 1px 1px rgba(28, 25, 23, 0.04), 0 8px 24px -12px rgba(28, 25, 23, 0.12)",
        "notebook-lg":
          "0 2px 4px rgba(28, 25, 23, 0.04), 0 18px 40px -20px rgba(28, 25, 23, 0.18)",
      },
      borderRadius: {
        sheet: "1.25rem",
      },
    },
  },
  plugins: [],
};
