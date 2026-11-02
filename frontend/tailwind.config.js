/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f8ec",
          100: "#e3f0d9",
          200: "#c7e1b4",
          500: "#4f8a3c",
          600: "#3f7230",
          700: "#325a27",
          800: "#28461f",
        },
      },
    },
  },
  plugins: [],
};
