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
          dark:    '#100828',
          darker:  '#080418',
          surface: '#1c0f42',
          silver:  '#d4d0e8',
          gray:    '#2a2040',
        },
        status: {
          green:  '#00e676',
          amber:  '#ffab00',
          blue:   '#00b8ff',
          red:    '#ff4d6a',
        }
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
