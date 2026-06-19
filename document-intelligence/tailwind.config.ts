import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        snow: '#F5F5F5',
        earth: '#290800',
        scarlet: '#FF3300',
        'earth-muted': '#6B4A40',
        amber: '#F59E0B',
        'dark-red': '#CC0000',
        muted: '#888880',
      },
      fontFamily: {
        sans: ['Inter', 'Söhne', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Söhne Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
