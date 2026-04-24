/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF5F7',
          100: '#D8E6EA',
          200: '#BAD0D8',
          300: '#92B1BE',
          400: '#678D9F',
          500: '#476F84',
          600: '#395C6F',
          700: '#2D4958',
          800: '#223744',
          900: '#17252F',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F4F7F8',
          100: '#EBF0F2',
          200: '#DCE4E8',
          300: '#C7D2D8',
          400: '#A8B7C0',
          500: '#8495A0',
          600: '#657681',
          700: '#4D5D67',
          800: '#33414B',
          900: '#1C2730',
        },
        sidebar: {
          bg: '#23313A',
          hover: '#2D3E48',
          active: '#476F84',
          text: '#A9B6BF',
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
