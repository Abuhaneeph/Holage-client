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
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-soft": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.7s ease-out forwards",
        "slide-up": "slide-up 0.8s ease-out forwards",
        "slide-right": "slide-right 0.8s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
