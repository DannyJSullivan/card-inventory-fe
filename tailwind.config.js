/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#1f2937',
          100: '#111827',
          200: '#0f172a',
          300: '#0c1221',
          400: '#080b14',
          500: '#050711',
          600: '#030507',
          700: '#020304',
          800: '#010101',
          900: '#000000',
        }
      }
    },
  },
  plugins: [],
}