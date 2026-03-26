/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF6F4',
          100: '#D0E8E2',
          200: '#A3D2C7',
          300: '#6FB8A8',
          400: '#3D9E8B',
          500: '#1A7D6D',
          600: '#146358',
          700: '#0F4A42',
          800: '#0A322D',
          900: '#061E1B',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
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
