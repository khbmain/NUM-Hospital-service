/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF6F4',
          100: '#D8ECE7',
          200: '#B5D8D0',
          300: '#88BBB0',
          400: '#5C9D91',
          500: '#3B7F75',
          600: '#30695F',
          700: '#28544C',
          800: '#1F4039',
          900: '#152B27',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F5F8F8',
          100: '#EDF2F2',
          200: '#E1E8E8',
          300: '#D0D9DA',
          400: '#B7C3C5',
          500: '#97A7AA',
          600: '#76868B',
          700: '#556368',
          800: '#394449',
          900: '#232B2F',
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
