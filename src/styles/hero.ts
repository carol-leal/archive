import { heroui } from "@heroui/react";

export default heroui({
  defaultTheme: "dark",
  themes: {
    dark: {
      colors: {
        primary: {
          foreground: "#ffffff",
          DEFAULT: "#E97D21",
          100: "#FDEFD2",
          200: "#FCDBA6",
          300: "#F8C178",
          400: "#F1A656",
          500: "#E97D21",
          600: "#C85F18",
          700: "#A74510",
          800: "#872F0A",
          900: "#6F2006",
        },

        success: { DEFAULT: "#64D33F" },
        focus: { DEFAULT: "#079FF7" },
        warning: { DEFAULT: "#F9D400", foreground: "#111111" },
        danger: { DEFAULT: "#FC5D28" },
      },
    },
  },
});
