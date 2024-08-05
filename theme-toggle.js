document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-theme');
    const themeStylesheet = document.getElementById('theme-stylesheet');

    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeStylesheet.href = savedTheme;
    }

    toggleButton.addEventListener('click', () => {
        if (themeStylesheet.href.includes('style.css')) {
            themeStylesheet.href = 'css/darkmode.css';
            localStorage.setItem('theme', 'css/darkmode.css');
        } else {
            themeStylesheet.href = 'css/style.css';
            localStorage.setItem('theme', 'css/style.css');
        }
    });
});