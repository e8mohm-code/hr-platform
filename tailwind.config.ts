import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-ibm-plex-arabic)',
          'var(--font-cairo)',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      fontSize: {
        // Hierarchy per spec
        h1:    ['28px', { lineHeight: '1.3',  fontWeight: '700' }],
        h2:    ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        h3:    ['18px', { lineHeight: '1.4',  fontWeight: '500' }],
        body:  ['14px', { lineHeight: '1.5',  fontWeight: '400' }],
        small: ['12px', { lineHeight: '1.5',  fontWeight: '400' }],
      },
      colors: {
        // Primary (Blue)
        primary: {
          DEFAULT: '#2563EB',
          50:  '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        // Status
        success: '#16A34A',
        warning: '#F59E0B',
        danger:  '#DC2626',
        // Neutrals (Gray scale)
        gray: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          300: '#D1D5DB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
        },
        // Aliases used across the app
        ink: {
          900: '#111827',
          700: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
        },
        bg:      '#F7F8FA',
        surface: '#FFFFFF',
        border:  '#E5E7EB',
      },
      spacing: {
        // Spec scale (uses Tailwind defaults: 4/8/12/16/24/32/40/48 = 1/2/3/4/6/8/10/12)
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
      },
      boxShadow: {
        card:      '0 1px 2px rgba(17,24,39,0.04), 0 1px 1px rgba(17,24,39,0.03)',
        cardHover: '0 4px 12px rgba(17,24,39,0.08), 0 2px 4px rgba(17,24,39,0.04)',
        glass:     '0 4px 20px rgba(0,0,0,0.05)',
        focus:     '0 0 0 3px rgba(37,99,235,0.15)',
      },
      animation: {
        'pulse-critical': 'pulseCritical 2s ease-out infinite',
        'fade-in':        'fadeIn 200ms ease-out',
        'slide-up':       'slideUp 300ms ease-out',
      },
      keyframes: {
        pulseCritical: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.35)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0)' },
        },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
