/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // Zinc 950
                foreground: "#fafafa", // Zinc 50
                primary: "#3b82f6", // Blue 500
                secondary: "#27272a", // Zinc 800
                accent: "#8b5cf6", // Violet 500
                danger: "#ef4444", // Red 500
                success: "#22c55e", // Green 500
                warning: "#eab308", // Yellow 500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            keyframes: {
                shine: {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' },
                }
            },
            animation: {
                shine: 'shine 1.5s infinite',
            },
        },
    },
    plugins: [],
}
