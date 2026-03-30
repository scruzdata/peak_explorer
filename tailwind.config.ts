import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Difficulty badge colors (dynamic in getDifficultyColor / getFerrataGradeColor)
    'bg-green-100', 'text-green-800',
    'bg-orange-100', 'text-orange-800',
    'bg-red-100', 'text-red-800',
    'bg-purple-100', 'text-purple-800',
    'bg-gray-500', 'text-white',
    // Legacy safelist
    'bg-green-500', 'bg-blue-500', 'bg-orange-500',
    'bg-red-500', 'bg-purple-500',
  ],
  theme: {
    extend: {
      colors: {
        // ── PRIMARY: Sky Blue ─────────────────────────────────────────
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',   // main brand
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // ── ACCENT: Summit Ember (CTAs, highlights) ───────────────────
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',   // vivid ember
          600: '#ea580c',   // CTA primary
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // ── CTA: Amber gold (stars, ratings, downloads) ───────────────
        cta: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // ── EDITORIAL: Warm dark stone tones ──────────────────────────
        editorial: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // ── SUMMIT: Alpine sky blue (map, info states) ────────────────
        summit: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card':        '0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.06)',
        'card-hover':  '0 8px 24px -4px rgba(0,0,0,0.14), 0 16px 40px -8px rgba(0,0,0,0.08)',
        'badge':       '0 1px 3px rgba(0,0,0,0.15)',
        'nav':         '0 1px 0 0 rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.06)',
        'glow-green':  '0 0 24px rgba(37,107,90,0.28)',
        'glow-ember':  '0 0 24px rgba(234,88,12,0.22)',
      },
      animation: {
        'fade-in':          'fadeIn 0.5s ease-in-out',
        'fade-up':          'fadeUp 0.6s ease-out',
        'slide-up':         'slideUp 0.5s ease-out',
        'scale-in':         'scaleIn 0.3s ease-out',
        'pulse-slow':       'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reveal':           'reveal 0.6s ease-out forwards',
        'shimmer':          'shimmer 1.8s linear infinite',
        'float':            'float 4s ease-in-out infinite',
        'slide-horizontal': 'slideHorizontal 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        reveal: {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        slideHorizontal: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%':      { transform: 'translateX(8px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
