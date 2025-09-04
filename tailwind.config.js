/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable dark mode dengan class strategy
  theme: {
    extend: {
      colors: {
        // Custom Color Palette from coolors.co
        jet: {
          DEFAULT: '#31312E',
          50: '#f7f7f6',
          100: '#e8e8e6',
          200: '#d7d7d4',
          300: '#afafaa',
          400: '#87877f',
          500: '#31312e',
          600: '#282826',
          700: '#1e1e1c',
          800: '#141413',
          900: '#0a0a09',
        },
        isabelline: {
          DEFAULT: '#FBF7F3',
          50: '#fefdfd',
          100: '#fdfcfa',
          200: '#fdfaf8',
          300: '#fcf9f6',
          400: '#fbf7f3',
          500: '#fbf7f3',
          600: '#e2c6a9',
          700: '#ca945f',
          800: '#946331',
          900: '#4a3119',
        },
        white: {
          DEFAULT: '#FFFFFF',
          50: '#ffffff',
          100: '#ffffff',
          200: '#ffffff',
          300: '#ffffff',
          400: '#cccccc',
          500: '#ffffff',
          600: '#999999',
          700: '#666666',
          800: '#333333',
          900: '#000000',
        },
        asparagus: {
          DEFAULT: '#729A4B',
          50: '#e3ecd9',
          100: '#c7dab4',
          200: '#abc78e',
          300: '#8fb569',
          400: '#729a4b',
          500: '#729a4b',
          600: '#5c7b3d',
          700: '#455c2d',
          800: '#2e3e1e',
          900: '#171f0f',
        },
        champagne: {
          DEFAULT: '#EDDCD2',
          50: '#fcf8f6',
          100: '#f8f1ed',
          200: '#f5ebe5',
          300: '#f1e4dc',
          400: '#eddcd2',
          500: '#eddcd2',
          600: '#d4ab93',
          700: '#ba7953',
          800: '#804f33',
          900: '#40281a',
        },
        
        // Semantic Colors untuk theme consistency
        primary: '#729A4B', // asparagus
        secondary: '#EDDCD2', // champagne
        accent: '#31312E', // jet
        background: '#FBF7F3', // isabelline
        surface: '#FFFFFF', // white
        'dark-bg': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-border': '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
