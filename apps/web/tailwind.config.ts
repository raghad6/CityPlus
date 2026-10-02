import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep municipal green — primary
        brand: {
          50: '#effaf6', 100: '#d8f2e8', 200: '#b3e4d3', 300: '#80cfb7', 400: '#4bb396',
          500: '#28977b', 600: '#1a7a64', 700: '#156253', 800: '#134e43', 900: '#113f37', 950: '#08241f',
        },
        // Terracotta accent — carried over from the prototype
        accent: {
          50: '#fcf4f3', 100: '#f9e7e5', 200: '#f3d2ce', 300: '#e9b1ab', 400: '#db857c',
          500: '#c9605a', 600: '#b4534b', 700: '#96403a', 800: '#7c3834', 900: '#683431',
        },
        ink: {
          50: '#f7f8f8', 100: '#eef0f0', 200: '#dde1e1', 300: '#c1c8c8', 400: '#9aa4a4',
          500: '#727d7d', 600: '#5a6464', 700: '#495151', 800: '#3d4444', 900: '#262b2b', 950: '#161919',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)',
        pop: '0 12px 32px -8px rgba(16,24,40,.18)',
      },
    },
  },
  plugins: [],
};
export default config;
