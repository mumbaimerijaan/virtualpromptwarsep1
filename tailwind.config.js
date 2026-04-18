/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./public/pages/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        pastel: '#f8fafc', // Matching GlobalConfig aesthetic
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
