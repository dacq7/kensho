/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dojo: {
          negro: '#111111',
          rojo: '#CC0000',
          dorado: '#C9A84C',
          surface: '#1a1a1a',
          subtle: '#0a0a0a',
        },
      },
      fontFamily: {
        dojo: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
