import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
      'white': '#FFFFFF',
      'rust-50': '#FBEDE6',
      'rust-100': '#F6D2BF',
      'rust-200': '#F0B292',
      'rust-300': '#E98F61',
      'rust-400': '#E1723F',
      'rust-500': '#B7410E',
      'rust-600': '#99360B',
      'rust-700': '#7C2B09',
      'rust-800': '#5E1C05',
      'rust-900': '#3D1003',
      'grey-50': '#E9EBEC',
      'grey-100': '#D1D5D8',
      'grey-200': '#B9BEC2',
      'grey-300': '#A1A8AD',
      'grey-400': '#899095',
      'grey-500': '#71797E',
      'grey-600': '#5E6368',
      'grey-700': '#45494D',
      'grey-800': '#2B2E31',
      'grey-900': '#121212',
      'teal': '#00796B',
      'ash-grey': '#B6B8B1',
    },
       
      fontFamily: {
        sans: ["Sora", "sans-serif"], // Override default sans
      
  },
    },
  },
  plugins: [],
}

export default config
