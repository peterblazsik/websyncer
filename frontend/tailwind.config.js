/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                amazon: {
                    dark: '#131921',
                    light: '#232f3e',
                    button: '#FFD814',
                    buttonHover: '#F7CA00',
                    page: '#EAEDED',
                    text: '#0F1111',
                    blue: '#007185',
                },
                brand: {
                    accent: '#007185', // Using Amazon Blue as accent
                }
            },
            fontFamily: {
                sans: ['Amazon Ember', 'Inter', 'sans-serif'],
                display: ['"Arial Black"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
