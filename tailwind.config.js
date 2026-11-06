/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#176B45',
          dark: '#104B34',
          light: '#E8F4EC',
          hover: '#135738',
        },
        personal: {
          DEFAULT: '#3478D4',
          light: '#EBF2FC',
          dark: '#245AA3',
        },
        fuel: {
          DEFAULT: '#E99A35',
          light: '#FCF5EB',
          dark: '#B8721B',
        },
        warning: {
          DEFAULT: '#E8A23A',
          light: '#FEF8EE',
        },
        danger: {
          DEFAULT: '#D9534F',
          light: '#FDF2F2',
          dark: '#B03531',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#19231D',
        },
        background: {
          light: '#F7F9F7',
          dark: '#101713',
        },
        border: {
          light: '#E5EAE6',
          dark: '#2B3930',
        },
        text: {
          primary: {
            light: '#17231C',
            dark: '#F0F5F1',
          },
          secondary: {
            light: '#738078',
            dark: '#A0AEA4',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      }
    },
  },
  plugins: [],
};

