/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                wawag: {
                    pink: '#FFB7B2',
                    'pink-light': '#FFDAC1',
                    yellow: '#FDFD96',
                    'yellow-dark': '#F4E99B',
                    blue: '#AEC6CF',
                    'blue-light': '#C4E0E5',
                    green: '#77DD77',
                    'green-light': '#B0E5B0',
                    purple: '#B39EB5',
                    'purple-light': '#D6CDEA',
                    cream: '#FBF7F5',
                    gray: '#CFCFC4',
                    dark: '#6B5B95',
                },
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
                '4xl': '3rem',
            },
            animation: {
                'bounce-soft': 'bounce 3s infinite',
                'float-up': 'float 6s ease-in-out infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'sparkle': 'sparkle 1.5s ease-in-out infinite',
                'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'pop-out': 'popOut 0.3s ease-in forwards',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                sparkle: {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.5, transform: 'scale(0.8)' },
                },
                popIn: {
                    '0%': { opacity: 0, transform: 'scale(0.5)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                },
                popOut: {
                    '0%': { opacity: 1, transform: 'scale(1)' },
                    '100%': { opacity: 0, transform: 'scale(0.5)' },
                }
            },
            fontFamily: {
                sans: ['var(--font-fredoka)', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
