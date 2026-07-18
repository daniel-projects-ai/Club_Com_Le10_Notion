/** Jetons de design mixtes : coquille Macao + espace coworkers LE 10. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        macao: { ink: '#1d1d1b', ink2: '#2a2a27', terra: '#c0562f', teal: '#206b73', gold: '#e9a94e' },
        petrol: { DEFAULT: '#00252b', light: '#0a343c', lighter: '#0e424b' },
        gold: { DEFAULT: '#efad29', soft: '#f6c96a' },
        cream: { DEFAULT: '#faf6ec', soft: '#f2ebd9' }
      },
      fontFamily: {
        sans: ['Work Sans', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif']
      },
      fontSize: { '2xs': '0.625rem' }
    }
  },
  plugins: []
}
