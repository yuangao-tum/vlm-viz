import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050510',
        surface: '#0d0d1a',
        border: '#1a1a2e',
        accent: '#3B5BDB',
        green: '#2F9E44',
        amber: '#E67700',
        purple: '#862E9C',
        teal: '#0CA678',
        muted: '#4a4a6a',
      },
      fontFamily: {
        mono: ['GeistMono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
