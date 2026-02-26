/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './_layouts/**/*.html',
    './_includes/**/*.html',
    './_pages/**/*.html',
    './_pages/**/*.md',
    './_posts/**/*.md',
    './src/**/*.{js,ts}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        'card-bg': 'var(--card-bg)',
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
      },
      maxWidth: {
        site: 'var(--max-width)',
      },
      borderRadius: {
        card: 'var(--radius)',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: '72ch',
            color: 'var(--text)',
            a: {
              color: 'var(--accent)',
              textDecoration: 'none',
              '&:hover': { opacity: '0.8' },
            },
            'h1, h2, h3, h4': {
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontWeight: '400',
              letterSpacing: '-0.02em',
            },
            code: {
              backgroundColor: 'var(--bg3)',
              borderRadius: '4px',
              padding: '0.2em 0.4em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
