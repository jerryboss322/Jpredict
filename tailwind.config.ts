import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base:    '#080e14',
        panel:   '#0d1520',
        card:    '#111d2b',
        raised:  '#162030',
        rim:     '#1d2d3e',
        amber:   '#f5a623',
        ultra:   '#00e5a0',
        vsafe:   '#22c55e',
        safe:    '#86efac',
        mod:     '#fbbf24',
        low:     '#f87171',
        win:     '#10b981',
        loss:    '#ef4444',
        void:    '#64748b',
        muted:   'rgba(255,255,255,0.40)',
        subtle:  'rgba(255,255,255,0.25)',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        mono:    ['Space Mono', 'Courier New', 'monospace'],
        body:    ['Outfit', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderColor: {
        dim:    'rgba(255,255,255,0.06)',
        soft:   'rgba(255,255,255,0.10)',
        bright: 'rgba(255,255,255,0.18)',
      },
      boxShadow: {
        amber:  '0 0 40px rgba(245,166,35,0.12), 0 0 80px rgba(245,166,35,0.06)',
        ultra:  '0 0 30px rgba(0,229,160,0.14)',
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
      },
      animation: {
        'bar-grow':   'barGrow 0.9s cubic-bezier(0.22,1,0.36,1) both',
        'fade-up':    'fadeUp 0.45s ease both',
        'live-pulse': 'livePulse 1.8s ease-in-out infinite',
      },
      keyframes: {
        barGrow: {
          from: { width: '0%' },
          to:   { /* handled inline */ },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}

export default config
