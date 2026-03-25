/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    '#0A182B',
          darker:  '#071422',
          surface: '#111f33',
          silver:  '#D1D3DA',
          gray:    '#1a2d45',
        },
        status: {
          green:  '#5DCAA5',
          amber:  '#EF9F27',
          blue:   '#85B7EB',
          red:    '#E24B4A',
        }
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, #111f33 0%, #0d1b2e 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #071422 0%, #091626 100%)',
      },
      boxShadow: {
        'glow-blue':  '0 0 20px rgba(133,183,235,0.12)',
        'glow-green': '0 0 20px rgba(93,202,165,0.12)',
        'glow-amber': '0 0 20px rgba(239,159,39,0.12)',
        'glow-red':   '0 0 20px rgba(226,75,74,0.12)',
        'card':       '0 4px 24px rgba(7,20,34,0.5)',
        'card-hover': '0 8px 40px rgba(7,20,34,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
