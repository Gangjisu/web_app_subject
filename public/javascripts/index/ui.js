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
const slides = document.querySelectorAll('.bg-slide');
let currentSlide = 0;

function nextSlide() {
    if(slides.length > 0) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
}

// Change background every 5 seconds
if(slides.length > 0) {
    setInterval(nextSlide, 5000);
}
