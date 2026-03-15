/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19', // Deep Void
        surface: '#1E293B',    // UI Gray
        accent: '#8A2BE2',     // Helicon Neon Violet
        neon: '#00F0FF',       // Cyberpunk Cyan
        active: '#FF003C',     // Magenta
        text: '#E2E8F0',       // Main text
        muted: '#64748B',      // Secondary text
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Clash Display"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.5)',
        'glow-violet': '0 0 20px rgba(138, 43, 226, 0.4)',
        'glow-magenta': '0 0 15px rgba(255, 0, 60, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
