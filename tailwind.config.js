/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#83472F', // İDOSB kahverengi
          light: '#A06148',
          dark: '#663521'
        },
        background: '#FAF9F6'
      }
    },
  },
  plugins: [],
}
