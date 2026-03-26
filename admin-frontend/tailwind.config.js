/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F4FE',
          100: '#D9E2FC',
          200: '#B3C5F9',
          300: '#809EF4',
          400: '#5278EE',
          500: '#2F5AD8',
          600: '#2248B5',
          700: '#1A3889',
          800: '#12275E',
          900: '#0A1733',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F7F8FA',
          100: '#F0F1F5',
          200: '#E2E4EA',
          300: '#D0D3DC',
          400: '#B5B9C6',
          500: '#9298A8',
          600: '#6B7280',
          700: '#4B5060',
          800: '#2D3140',
          900: '#181B25',
        },
        sidebar: {
          bg: '#1C1F2E',
          hover: '#262A3C',
          active: '#2F5AD8',
          text: '#9298A8',
          textActive: '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        body: ['"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
