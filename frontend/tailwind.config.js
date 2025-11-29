/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc7c2',
          300: '#ffa199',
          400: '#ff6b5b',
          500: '#ee4d2d', // Shopee Orange
          600: '#d73211',
          700: '#b42a0e',
          800: '#952612',
          900: '#7b2515',
        },
      },
    },
  },
  plugins: [],
};