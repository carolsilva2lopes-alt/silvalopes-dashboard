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
          dark: '#0A182B',
          darker: '#071422',
          surface: '#111f33',
          silver: '#D1D3DA',
          gray: '#2F2F2F',
        },
        status: {
          green: '#5DCAA5',
          amber: '#EF9F27',
          blue: '#85B7EB',
          red: '#E24B4A',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
