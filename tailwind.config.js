/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./demo/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [require('flowbite/plugin')],
}
