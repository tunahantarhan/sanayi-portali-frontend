/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Değerler çalışma anında src/config.js'ten CSS değişkeni olarak gelir (src/theme.js).
        // Varsayılanlar src/index.css içindedir.
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          light: 'rgb(var(--color-brand-light) / <alpha-value>)',
          dark: 'rgb(var(--color-brand-dark) / <alpha-value>)',
        },
        background: '#FAF9F6',
      },
    },
  },
  plugins: [],
};
