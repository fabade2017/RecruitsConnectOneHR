module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 900: '#0c4a6e' },
        ink: '#0F172A',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31,38,135,0.07)',
        glow: '0 0 40px rgba(14,165,233,0.15)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
