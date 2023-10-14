/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // primary: 'var(--ax-color-primary)',
        // 'body-bg': 'var(--ax-body-bg)',
        // 'body-color': 'var(--ax-body-color)',
        // 'strong-color': 'var(--ax-strong-color)',
        // 'card-bg': 'var(--ax-card-bg)',
        primary: '#3ADCEF',
        'body-bg': '#101213',
        'body-color': '#a8abbe',
        'strong-color': '#ffffff',
        'card-bg': '#23232F',
      },
      minHeight: {
        'min-h-screen': 'calc(100vh - 90px)',
      },
    },
  },
  plugins: [],
}
