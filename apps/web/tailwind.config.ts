import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '320px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: '#0B0F17',
        surface: {
          DEFAULT: '#111827',
          50: '#1F2937',
          100: '#1A2234',
          200: '#131B2B',
          glass: 'rgba(17, 24, 39, 0.75)',
        },
        brand: {
          50: '#EEF2FF',
          400: '#818CF8',
          500: '#6366F1', // Indigo
          600: '#4F46E5',
          accent: '#06B6D4', // Cyan
        },
        accent: {
          pink: '#EC4899',
          amber: '#F59E0B',
          emerald: '#10B981',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        // Use the CSS var injected by next/font/google — avoids any FOUT
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
