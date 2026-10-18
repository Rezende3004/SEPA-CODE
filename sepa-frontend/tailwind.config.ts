import type { Config } from 'tailwindcss';

/**
 * Fonte única dos tokens visuais do SEPA.
 * A paleta foi derivada do protótipo (gráfico do motor de IA) e ajustada
 * para contraste WCAG AA. O painel do aluno usa tons mais suaves.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F5F0',
        surface: '#FFFFFF',
        ink: '#1F2D36',
        muted: '#566873',
        line: '#DCE3E6',
        primary: {
          DEFAULT: '#2A6F97',
          dark: '#1F5675',
          soft: '#E7F0F5',
        },
        secondary: {
          DEFAULT: '#F4A261',
          dark: '#B86E2C',
          soft: '#FDF1E4',
        },
        accent: {
          DEFAULT: '#E76F51',
          soft: '#FBEAE5',
        },
        success: {
          DEFAULT: '#4F8A6D',
          soft: '#E9F2EC',
        },
        warning: {
          DEFAULT: '#A8641C',
          soft: '#FBF0E1',
        },
        danger: {
          DEFAULT: '#B4483C',
          soft: '#F9E9E7',
        },
        kid: {
          canvas: '#FBF8F3',
          surface: '#FFFFFF',
          primary: '#2F6F7E',
          soft: '#E8F2F3',
          accent: '#C9854E',
          muted: '#4A5E66',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(31, 45, 54, 0.08)',
        card: '0 2px 10px rgba(31, 45, 54, 0.06)',
      },
      spacing: {
        18: '4.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        pop: 'pop 180ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
