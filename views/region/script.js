document.addEventListener('DOMContentLoaded', () => {
    // =================================================
    // Common Variables
    // =================================================
    const container = document.querySelector('.container');
    const sections = document.querySelectorAll('.section');
    const progressDots = document.querySelectorAll('.progress-bar li');
    let currentSectionIndex = 0;
    let isSwiping = false;

    // =================================================
    // Milestone Progress Bar Code
    // =================================================

    // Function to update the active progress dot
    function updateProgress() {
        const currentSection = sections[currentSectionIndex];
        const currentSectionId = currentSection.id;

        progressDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.dataset.section === currentSectionId) {
                dot.classList.add('active');
            }
        });
    }

    // Add click event listeners to progress dots
    progressDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetSectionId = dot.dataset.section;
            
            // Find the first section with the target ID
            const targetSectionIndex = Array.from(sections).findIndex(section => section.id === targetSectionId);

            if (targetSectionIndex !== -1) {
                currentSectionIndex = targetSectionIndex;
                updateSectionDisplay();
            }
        });
    });

    // Initial update
    updateProgress();
    
    // =================================================
    // Existing Code for Section Scrolling
    // =================================================

    // Function to update the section display
    function updateSectionDisplay() {
        container.style.transform = `translateY(-${currentSectionIndex * 100}vh)`;
        updateProgress(); // Also update progress bar on scroll
    }

    // Handle mouse wheel for scrolling
    document.addEventListener('wheel', (event) => {
        if (isSwiping) return;

        isSwiping = true;

        if (event.deltaY > 0) { // Scroll down
            if (currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
            } else { // If at the last section, go to the first
                currentSectionIndex = 0;
            }
        } else { // Scroll up
            if (currentSectionIndex > 0) {
                currentSectionIndex--;
            } else { // If at the first section, go to the last
                currentSectionIndex = sections.length - 1;
            }
        }
        updateSectionDisplay();

        setTimeout(() => {
            isSwiping = false;
        }, 700); // Match CSS transition duration
    });

    // Handle touch events for swiping on mobile
    let touchStartY = 0;
    let touchEndY = 0;

    container.addEventListener('touchstart', (event) => {
        touchStartY = event.touches[0].clientY;
    });

    container.addEventListener('touchmove', (event) => {
        touchEndY = event.touches[0].clientY;
    });

    container.addEventListener('touchend', () => {
        if (isSwiping) return;

        isSwiping = true;

        if (touchStartY - touchEndY > 50) { // Swipe up (equivalent to scroll down)
            if (currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
            } else { // If at the last section, go to the first
                currentSectionIndex = 0;
            }
        } else if (touchEndY - touchStartY > 50) { // Swipe down (equivalent to scroll up)
            if (currentSectionIndex > 0) {
                currentSectionIndex--;
            } else { // If at the first section, go to the last
                currentSectionIndex = sections.length - 1;
            }
        }
        updateSectionDisplay();

        setTimeout(() => {
            isSwiping = false;
        }, 700); // Match CSS transition duration

        touchStartY = 0;
        touchEndY = 0;
    });
});

//////////////////// 
// 1. 유튜브 IFrame API 코드를 비동기로 로드
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. API 코드가 다운로드 된 후 실행되는 함수
var player;
function onYouTubeIframeAPIReady() {
player = new YT.Player('player', {
    videoId: 'MdL8JG6wl_M', // 여기에 원하는 영상 ID 입력 (현재: 드론 영상)
    playerVars: {
    'autoplay': 1, 
    'controls': 0, 
    'start': 13,
    'loop': 1, 
    'playlist': 'MdL8JG6wl_M', // 반복 재생을 위해 ID 한 번 더 입력
    'mute': 1, // 자동재생을 위해 음소거 필수
    'playsinline': 1,
    'rel': 0,
    'modestbranding': 1
    },
    events: {
    'onReady': onPlayerReady
    }
});
}

// 3. 플레이어가 준비되면 화질 설정 및 재생
function onPlayerReady(event) {
event.target.mute(); // 확실하게 음소거

// 핵심: 화질을 낮게 설정 (small, medium, large, hd720 ...)
event.target.setPlaybackQuality('small'); 

event.target.playVideo();
}
