/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        'respo-blue': '#2E8BCC',
        'respo-blue-light': '#E9F5FF',
        'respo-blue-action': '#549DDF',
        'respo-green': '#B1C53F',
        'respo-dark': '#1A1A1A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
      },
      spacing: {
        '80': '80px',
        '120': '120px',
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'md': '12px',
        'full': '9999px',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '24px',
        sm: '36px',
        lg: '120px',
      },
    },
  },
  plugins: [],
}
