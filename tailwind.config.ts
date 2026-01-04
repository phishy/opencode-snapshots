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
        oc: {
          'bg-base': '#131010',
          'bg-weak': '#1c1717',
          'bg-strong': '#151313',
          'bg-elevated': '#252121',
          'border': '#4b4646',
          'border-subtle': '#252121',
          'text-strong': '#f1ecec',
          'text-base': '#b7b1b1',
          'text-weak': '#716c6b',
          'green': '#37db2e',
          'red': '#ff917b',
          'blue': '#89b5ff',
          'brand': '#fdffca',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
