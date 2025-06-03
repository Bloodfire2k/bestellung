import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        edeka: {
          blue: '#2b64b1',
          'blue-dark': '#1e4a8c',
          'blue-light': '#4a7bc8',
        }
      },
    },
  },
  plugins: [],
} satisfies Config; 