/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: {
              backgroundColor: '#1E1E1E',
              color: '#D4D4D4',
              padding: '0',
            },
            code: {
              backgroundColor: '#1E1E1E',
              color: '#D4D4D4',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
              '&::before': {
                content: '""',
              },
              '&::after': {
                content: '""',
              }
            },
          },
        },
        invert: {
          css: {
            pre: {
              backgroundColor: '#1E1E1E',
              color: '#D4D4D4',
            },
            code: {
              backgroundColor: '#1E1E1E',
              color: '#D4D4D4',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

