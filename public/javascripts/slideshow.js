document.addEventListener('DOMContentLoaded', () => {
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
});
