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
        primary: '#1677ff',
        'body-bg': '#f8fafc',
        'body-color': '#6a6d7c',
        'strong-color': '#262833',
        'card-bg': '#ffffff',
      },
      minHeight: {
        'min-h-screen': 'calc(100vh - 90px)',
      },
    },
  },
  plugins: [],
}
