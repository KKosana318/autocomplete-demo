/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            boxShadow: {
                md: "0px 0px 8px rgba(189, 189, 189, 0.6)",
            },
        },
    },
    plugins: [],
};
