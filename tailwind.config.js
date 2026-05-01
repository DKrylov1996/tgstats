/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 22px 70px rgba(72, 45, 72, 0.12)',
        card: '0 12px 42px rgba(56, 46, 64, 0.10)',
      },
      colors: {
        ink: '#25202a',
        berry: '#a43b62',
        coral: '#d86f6f',
        mint: '#4f9b8f',
        wine: '#6b2543',
      },
    },
  },
  plugins: [],
};
