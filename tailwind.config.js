/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark navy blue, muted brick red, white color scheme
        primary: "#1e3a8a", // Dark navy blue
        secondary: "#b91c1c", // Muted brick red
        accent: "#dc2626", // Slightly brighter red for accents
        background: "#ffffff", // White
        surface: "#f8fafc", // Very light gray for surfaces
        text: {
          primary: "#1e3a8a", // Dark navy blue for primary text
          secondary: "#64748b", // Gray for secondary text
          light: "#ffffff", // White text
        },
        border: "#e2e8f0",
        input: "#f1f5f9",
        ring: "#1e3a8a",
        foreground: "#1e3a8a",
        destructive: {
          DEFAULT: "#b91c1c",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1e3a8a",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1e3a8a",
        },
        success: "#059669",
        warning: "#d97706",
        error: "#b91c1c",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
