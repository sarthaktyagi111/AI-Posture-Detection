/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#F4F6F8', dark: '#0E1620' },
        ink: { DEFAULT: '#17212E', dark: '#EAF0F6' },
        line: { DEFAULT: '#D8DEE6', dark: '#243040' },
        muted: { DEFAULT: '#5C6B7A', dark: '#8494A6' },
        good: { DEFAULT: '#2E7D5B', soft: '#E4F2EC', dark: '#4FAE85' },
        attention: { DEFAULT: '#DD7C3F', soft: '#FBEBDE', dark: '#F0985F' },
        plumb: { DEFAULT: '#3D6FE0', soft: '#E7EDFC', dark: '#7DA0F0' },
        surface: { DEFAULT: '#FFFFFF', dark: '#161F2B' },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
