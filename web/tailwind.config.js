/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C65D3B',
          light: '#D97B5D',
          dark: '#A3472A',
        },
        mediterranean: {
          DEFAULT: '#006994',
          light: '#0088B5',
          dark: '#004D6B',
        },
        olive: {
          DEFAULT: '#808000',
          light: '#9A9A1A',
          dark: '#666600',
        },
        sand: {
          DEFAULT: '#F5F5DC',
          light: '#FAFAE8',
          dark: '#E8E8C8',
        },
        coral: {
          DEFAULT: '#FF7F50',
          light: '#FF9A75',
          dark: '#E06540',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Kufi Arabic', 'system-ui', 'sans-serif'],
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
