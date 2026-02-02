/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'vscode-bg': '#1e1e1e',
                'vscode-sidebar': '#252526',
                'vscode-activity': '#333333',
                'vscode-statusbar': '#007acc',
            }
        },
    },
    plugins: [],
}
