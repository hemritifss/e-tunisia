/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        /* Same ramp as tokens.css: #16447A → #1E5FA8 → #4B8FD4 → #E4EDF9.
           Key names are frozen so the ~70 existing utility classes still
           compile; Phase 2 re-points them at the CSS custom properties. */
        brand: {
          DEFAULT: '#1E5FA8',
          light: '#4B8FD4',
          dark: '#16447A',
        },
        mediterranean: {
          DEFAULT: '#4B8FD4',
          light: '#7FB0E0',
          dark: '#1E5FA8',
        },
        olive: {
          DEFAULT: '#4A7A47',
          light: '#7FB37C',
          dark: '#365A34',
        },
        sand: {
          DEFAULT: '#E7DECC',
          light: '#F2EBDD',
          dark: '#8A7550',
        },
        /* Coral collapsed into the one accent. */
        coral: {
          DEFAULT: '#1E5FA8',
          light: '#4B8FD4',
          dark: '#16447A',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          hover: 'var(--surface-hover)',
        },
        foreground: 'var(--text-primary)',
        'muted-foreground': 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
        'bg-primary': 'var(--bg-primary)',
      },
      backgroundColor: {
        page: 'var(--bg-primary)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      fontFamily: {
        sans: ['Instrument Sans', 'Noto Kufi Arabic', 'system-ui', 'sans-serif'],
        arabic: ['Noto Kufi Arabic', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease-in-out',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(198, 93, 59, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(198, 93, 59, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
