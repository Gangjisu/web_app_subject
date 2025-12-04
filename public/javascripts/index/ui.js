// Initialize Lucide Icons
lucide.createIcons();

// State Management
const body = document.body;
let isCollapsed = false;

// Functions for Layout switching
window.collapseView = function() {
    body.classList.add('collapsed-mode');
    isCollapsed = true;
}

window.expandView = function() {
    body.classList.remove('collapsed-mode');
    isCollapsed = false;
}

window.resetView = function() {
    // "Index 페이지로 돌아가기" logic - similar to expand but conceptually reloading/resetting
    expandView();
    // Optional: reset other states if needed
}

// Background Slider Logic
// Background Slider Logic moved to slideshow.js
