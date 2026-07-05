export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte graphique LE 10 Coworking
        petrol: {
          DEFAULT: '#00252b',
          light: '#0a343c',
          lighter: '#0e424b',
        },
        gold: {
          DEFAULT: '#efad29',
          soft: '#f6c96a',
        },
        terra: '#b5432a',
        olive: '#6b7a2f',
        cream: {
          DEFAULT: '#faf6ec',
          soft: '#f2ebd9',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Work Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
}
