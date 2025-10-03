module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f9ff',
          100: '#e6f0ff',
          500: '#4c6ef5',
          600: '#364fc7',
          950: '#05021a',
        },
        accent: '#f97316',
      },
      boxShadow: {
        neon: '0 20px 60px rgba(76, 110, 245, 0.35)',
      },
    },
  },
  plugins: [],
};
