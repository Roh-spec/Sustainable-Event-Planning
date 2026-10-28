/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Token Scale (Palettes A, B, C)
        canvas: {
          DEFAULT: withOpacity("--c-canvas"),
          2: withOpacity("--c-canvas-2"),
        },
        surface: {
          DEFAULT: withOpacity("--c-surface"),
          inset: withOpacity("--c-surface-inset"),
        },
        highlight: withOpacity("--c-highlight"),
        ink: {
          DEFAULT: withOpacity("--c-ink"),
          muted: withOpacity("--c-ink-muted"),
          faint: withOpacity("--c-ink-faint"),
        },
        line: {
          DEFAULT: withOpacity("--c-line"),
          strong: withOpacity("--c-line-strong"),
        },
        primary: {
          DEFAULT: withOpacity("--c-primary"),
          deep: withOpacity("--c-primary-deep"),
        },
        accent: {
          DEFAULT: withOpacity("--c-accent"),
          deep: withOpacity("--c-accent-deep"),
        },
        danger: {
          DEFAULT: withOpacity("--c-danger"),
          deep: withOpacity("--c-danger-deep"),
          bg: withOpacity("--c-danger-bg"),
          border: withOpacity("--c-danger-border"),
        },

        // Backward-Compatible Aliases mapped to CSS Variables
        paper: {
          DEFAULT: withOpacity("--c-canvas"),
          raised: withOpacity("--c-surface"),
          inset: withOpacity("--c-surface-inset"),
        },
        moss: {
          50: withOpacity("--c-highlight"),
          100: "rgb(var(--c-canvas-2) / 0.6)",
          200: "rgb(var(--c-line) / 0.8)",
          300: withOpacity("--c-line-strong"),
          400: withOpacity("--c-primary"),
          500: withOpacity("--c-primary"),
          600: withOpacity("--c-primary"),
          700: withOpacity("--c-primary-deep"),
          800: withOpacity("--c-primary-deep"),
          900: withOpacity("--c-primary-deep"),
          950: withOpacity("--c-primary-deep"),
        },
        clay: {
          50: withOpacity("--c-highlight"),
          100: "rgb(var(--c-highlight))",
          200: withOpacity("--c-line"),
          300: withOpacity("--c-line-strong"),
          400: withOpacity("--c-accent"),
          500: withOpacity("--c-accent"),
          600: withOpacity("--c-accent-deep"),
          700: withOpacity("--c-accent-deep"),
          800: withOpacity("--c-accent-deep"),
          900: withOpacity("--c-accent-deep"),
          stamp: withOpacity("--c-accent-deep"),
        },
      },
      fontFamily: {
        sans: [
          '"DM Sans"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ['"Newsreader"', "Georgia", "Times New Roman", "serif"],
        serif: ['"Newsreader"', "Georgia", "Times New Roman", "serif"],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "display-xl": [
          "clamp(3.5rem, 7vw, 6.5rem)",
          { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
        "display-lg": [
          "2.75rem",
          { lineHeight: "1.1", letterSpacing: "-0.025em", fontWeight: "600" },
        ],
        "display-md": [
          "2rem",
          { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
      },
      borderWidth: {
        rule: "1px",
        "rule-strong": "2px",
      },
      boxShadow: {
        subtle: "var(--glass-shadow)",
        modal: "var(--modal-shadow)",
        // Notebook alias for transition:
        notebook: "var(--glass-shadow)",
      },
      zIndex: {
        backdrop: "var(--z-backdrop, -1)",
        grain: "var(--z-grain, 5)",
        content: "var(--z-content, 0)",
        sticky: "var(--z-sticky, 30)",
        header: "var(--z-header, 40)",
        modal: "var(--z-modal, 50)",
        toast: "var(--z-toast, 60)",
      },
      borderRadius: {
        control: "4px",
        sheet: "6px",
      },
    },
  },
  plugins: [],
};
