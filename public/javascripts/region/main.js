lucide.createIcons();

const sections = document.querySelectorAll('section');
const navDots = document.querySelectorAll('.nav-dot');

const observerOptions = {
    root: document.querySelector('#main-container'),
    threshold: 0.51
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const groupName = entry.target.dataset.group;
            
            navDots.forEach(dot => {
                const targetGroup = dot.dataset.target;
                if(targetGroup === groupName) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // Trigger animations
            const animatedElements = entry.target.querySelectorAll('.animate-fade-in-up');
            animatedElements.forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; 
                el.style.animation = null; 
            });
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

function scrollToSection(index) {
    const sections = document.querySelectorAll('section');
    const targetSection = sections[index];
    targetSection.scrollIntoView({ behavior: 'smooth' });
}

function adjustFontSizes() {
    const titles = document.querySelectorAll('.city-title');
    
    titles.forEach(title => {
        const textLength = title.textContent.trim().length;
        const baseSizeRem = parseFloat(title.dataset.baseSize || 10);
        let newSizeRem = baseSizeRem;

        if (textLength > 10) {
                newSizeRem = baseSizeRem * 0.5;
        } else if (textLength > 7) {
            newSizeRem = baseSizeRem * 0.7;
        }

        if (window.innerWidth < 768) {
            newSizeRem = newSizeRem * 0.5;
        }

        title.style.fontSize = `${newSizeRem}rem`;
    });
}

adjustFontSizes();
window.addEventListener('resize', adjustFontSizes);
