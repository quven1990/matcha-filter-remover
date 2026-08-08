import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        matcha: {
          DEFAULT: "#2f6b4a",
          deep: "#1e4632",
          soft: "#6fa887",
          mist: "#d7e5d8",
        },
        foam: "#f4efe6",
        ink: "#14201a",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
