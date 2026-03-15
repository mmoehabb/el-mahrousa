/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'egyptian-gold': '#D4AF37',
        'egyptian-blue': '#1034A6',
        'egyptian-red': '#E0115F',
        'sand': '#F4A460',
      },
      backgroundImage: {
        'papyrus': "url('https://www.transparenttextures.com/patterns/papyrus.png')",
      }
    },
  },
  plugins: [],
}
