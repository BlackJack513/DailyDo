/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        body: 'rgb(var(--color-body) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-2) / <alpha-value>)',
          tertiary: 'rgb(var(--color-surface-3) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
        control: 'rgb(var(--color-control) / <alpha-value>)',
        content: {
          DEFAULT: 'rgb(var(--color-content) / <alpha-value>)',
          secondary: 'rgb(var(--color-content-sec) / <alpha-value>)',
          tertiary: 'rgb(var(--color-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-divider) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-3) / <alpha-value>)',
        },
        divider: 'rgb(var(--color-divider) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
