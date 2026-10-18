import type { Config } from 'tailwindcss';

/**
 * Fonte única dos tokens visuais do SEPA.
 * Identidade cromática: azul, laranja, amarelo e branco.
 * Tons de apoio (soft/dark) pertencem a essas quatro famílias e mantêm
 * contraste WCAG AA para texto.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        ink: '#173042',
        muted: '#4B6273',
        line: '#D5E2EA',
        primary: {
          DEFAULT: '#1F5C8B',
          dark: '#154466',
          soft: '#E7F1F8',
        },
        secondary: {
          DEFAULT: '#E07A2F',
          dark: '#A95312',
          soft: '#FCEBDE',
        },
        accent: {
          DEFAULT: '#F2C14E',
          dark: '#7A5A00',
          soft: '#FFF6D8',
        },
        success: {
          DEFAULT: '#1F5C8B',
          soft: '#E7F1F8',
        },
        warning: {
          DEFAULT: '#7A5A00',
          soft: '#FFF6D8',
        },
        danger: {
          DEFAULT: '#A95312',
          soft: '#FCEBDE',
        },
        kid: {
          canvas: '#FFFFFF',
          surface: '#FFFFFF',
          primary: '#1F5C8B',
          soft: '#E7F1F8',
          accent: '#E07A2F',
          muted: '#173042',
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
    },
  },
  plugins: [],
} satisfies Config;
