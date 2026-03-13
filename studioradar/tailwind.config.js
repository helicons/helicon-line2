/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#050505',
        accent: '#8A2BE2',
        surface: '#1A1A1A',
        text: '#E0E0E0',
      },

      fontFamily: {
        heading: ['"Clash Display"', 'sans-serif'],
        ui: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
