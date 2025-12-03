// Global Variables & Constants
let planCount = 2;
const LOCATION_NAME = "Tokyo, Japan";
const INITIAL_COORDS = { lat: 35.6895, lng: 139.6917 };
let map, streetView, cesiumViewer; 
let currentPlaceUrl = null; // Global variable to store the Google Maps URL
let currentMarker = null;

async function initMap() {
    // 1. maps3d 라이브러리 로드
    await google.maps.importLibrary("maps3d");

    // 2. gmp-map-3d 엘리먼트 생성 (HTML 태그와 동일한 방식 사용)
    map = document.createElement('gmp-map-3d');

    // 3. 속성 설정 (문자열로 설정하여 안정성 확보)
    map.setAttribute('center', '35.6895,139.6917'); // 도쿄 좌표 (위도,경도)
    map.setAttribute('tilt', '60');
    map.setAttribute('range', '2000');
    map.setAttribute('heading', '30');
    map.setAttribute('mode', 'hybrid'); // 위성/로드 하이브리드 모드

    // 4. DOM에 추가
    document.getElementById('map-container').append(map);
}

initMap();

// Search Logic (with Autocomplete, Marker, and View Detail link)
async function setupSearch() {
    const input = document.getElementById('destination_input');
    const autocompleteResultsDiv = document.getElementById('autocomplete_results');
    const viewDetailButton = document.getElementById('view_detail_button');
    if (!input || !autocompleteResultsDiv || !viewDetailButton) return;

    // Import Places Library for AutocompleteService and PlacesService
    const { AutocompleteService, PlacesService } = await google.maps.importLibrary("places");
    const autocompleteService = new AutocompleteService();
    
    // For PlacesService (used for actual search), it still needs a dummy div for attributions
    const attrContainer = document.createElement('div');
    const placesService = new PlacesService(attrContainer);

    // Initialize View Detail Button
    viewDetailButton.style.display = 'none'; // Initially hidden
    viewDetailButton.addEventListener('click', () => {
        if (currentPlaceUrl) {
            window.open(currentPlaceUrl, '_blank'); // Open in new tab
        }
    });

    // Function to fetch place details and update map/marker/button
    async function updateLocation(placeId) {
        if (!placeId) return;

        const request = {
            placeId: placeId,
            fields: ['name', 'geometry', 'formatted_address', 'url'], // Request 'url' for Google Maps URL
        };

        placesService.getDetails(request, async (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                const location = place.geometry.location;
                
                // Import necessary libraries for 3D Marker
                const { Marker3DInteractiveElement } = await google.maps.importLibrary("maps3d");
                const { PinElement } = await google.maps.importLibrary("marker");

                if (map) {
                    // 1. Smooth Fly Camera Animation
                    map.flyCameraTo({
                        endCamera: {
                            center: { lat: location.lat(), lng: location.lng(), altitude: 0 },
                            range: 2000, // Closer range for detail
                            tilt: 60,
                            heading: 0
                        },
                        durationMillis: 2000 // 2 seconds duration
                    });

                    // Remove existing marker if any
                    if (currentMarker) {
                        currentMarker.remove();
                        currentMarker = null;
                    }

                    // 2. Create PinElement
                    const pin = new PinElement({
                        glyphText: ``, //get plan number 
                        scale: 1.5,
                        glyphColor: "#FFFFFF"
                    });

                    // 3. Create Marker3DInteractiveElement
                    const interactiveMarker = new Marker3DInteractiveElement({
                        title: place.name,
                        position: { lat: location.lat(), lng: location.lng(), altitude: 50 }, // Lift marker 50m above ground
                        altitudeMode: 'RELATIVE_TO_GROUND', // Ensure visibility on terrain
                    });

                    // Append Pin to Marker
                    interactiveMarker.append(pin);

                    // Add Marker to Map
                    map.append(interactiveMarker);

                    // Update global references
                    currentMarker = interactiveMarker;
                }

                // Update and show View Detail button
                currentPlaceUrl = place.url; // Use place.url directly for Google Maps link
                if (!currentPlaceUrl && place.geometry) { // Fallback if place.url is not available
                    currentPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat()},${place.geometry.location.lng()}`;
                }
                viewDetailButton.style.display = 'block';

                console.log("Place Details:", place);

            } else {
                console.warn("getDetails failed:", status);
            }
        });
    }

    // Autocomplete Logic
    let activeItem = -1; // For keyboard navigation

    input.addEventListener('input', async () => {
        const query = input.value;
        if (!query) {
            autocompleteResultsDiv.innerHTML = '';
            viewDetailButton.style.display = 'none'; // Hide button if input is empty
            return;
        }

        const request = {
            input: query,
        };

        autocompleteService.getPlacePredictions(request, (predictions, status) => {
            autocompleteResultsDiv.innerHTML = ''; // Clear previous results
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                predictions.forEach((prediction, index) => {
                    const item = document.createElement('div');
                    item.classList.add('autocomplete_item');
                    item.innerHTML = prediction.description; // Display the suggested text
                    
                    item.addEventListener('click', () => {
                        input.value = prediction.description; // Fill input with selected prediction
                        autocompleteResultsDiv.innerHTML = ''; // Clear suggestions
                        updateLocation(prediction.place_id); // Trigger update with place_id
                    });
                    autocompleteResultsDiv.appendChild(item);
                });
            } else {
                // console.warn("Autocomplete failed:", status);
            }
        });
    });

    // Handle Enter key for direct search (from previous step)
    // and also keyboard navigation for autocomplete
    input.addEventListener('keydown', async (e) => {
        let items = autocompleteResultsDiv.querySelectorAll('.autocomplete_item');

        if (e.key === 'ArrowDown') {
            activeItem = (activeItem + 1) % items.length;
            setActiveItem(items, activeItem);
            e.preventDefault(); // Prevent cursor movement
        } else if (e.key === 'ArrowUp') {
            activeItem = (activeItem - 1 + items.length) % items.length;
            setActiveItem(items, activeItem);
            e.preventDefault(); // Prevent cursor movement
        } else if (e.key === 'Enter') {
            if (activeItem > -1 && items.length > 0) {
                // Simulate click on active item
                items[activeItem].click();
            } else {
                // If no active item or no suggestions, perform direct search using current input value
                // For direct search, we need to find the place_id first
                autocompleteService.getPlacePredictions({ input: input.value }, (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
                        updateLocation(predictions[0].place_id); // Use the first prediction's place_id
                    } else {
                        console.warn("Direct search prediction failed:", status);
                        // Fallback to query search if prediction fails
                        // This uses PlacesService.findPlaceFromQuery as in previous iteration
                        performQuerySearch(input.value); 
                    }
                });
            }
            autocompleteResultsDiv.innerHTML = ''; // Clear suggestions
        } else if (e.key === 'Escape') {
            autocompleteResultsDiv.innerHTML = ''; // Clear suggestions
            // input.value = ''; // Optional: Clear input as well on Escape
        }
    });

    // Helper to set active class for keyboard navigation
    function setActiveItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
                input.value = item.textContent; // Update input with active item's text
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Fallback function for direct query search if autocomplete fails to provide place_id
    function performQuerySearch(query) {
        if (!query) return;

        const request = {
            query: query,
            fields: ['place_id'],
        };

        placesService.findPlaceFromQuery(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                updateLocation(results[0].place_id);
            } else {
                console.warn("Query search failed:", status);
            }
        });
    }
}

// UI & Interaction Setup
function setupEventListeners() {
    setupSearch();
    setupTabMenu();
    setupActionButtons();
    setupPlanList();
    setupSectionNavigation();
    initDateInputs();
}

// Section Navigation Logic (Smooth Transitions)
function setupSectionNavigation() {
    const preplanSection = document.querySelector('.preplan_setting');
    const aiSection = document.querySelector('.ai_recommendations');
    
    const btnToRecommendations = document.getElementById('btn-to-recommendations');
    const btnToPreplan = document.getElementById('btn-to-preplan');

    // Helper function for smooth transition
    function switchSection(hideSection, showSection) {
        // 1. Fade out the current section
        hideSection.style.opacity = '0';
        hideSection.style.pointerEvents = 'none'; // Prevent clicks during fade out
        
        // 2. Wait for the transition (0.5s) to finish
        setTimeout(() => {
            hideSection.style.display = 'none';
            
            // 3. Prepare the next section
            showSection.style.display = 'block';
            showSection.style.opacity = '0'; // Ensure it starts invisible
            
            // 4. Force reflow to ensure the browser registers the display change before fading in
            void showSection.offsetWidth; 
            
            // 5. Fade in the next section
            showSection.style.opacity = '1';
            showSection.style.pointerEvents = 'auto'; // Re-enable clicks
        }, 500); // Matches CSS transition time
    }

    // Event Listeners
    if (btnToRecommendations && preplanSection && aiSection) {
        btnToRecommendations.addEventListener('click', () => {
            switchSection(preplanSection, aiSection);
        });
    }

    if (btnToPreplan && preplanSection && aiSection) {
        btnToPreplan.addEventListener('click', () => {
            switchSection(aiSection, preplanSection);
        });
    }
}

// Tab Menu Logic
function setupTabMenu() {
    const buttons = document.querySelectorAll('.tab-button');
    const googleMapContainer = document.getElementById('google-map');
    const cesiumContainer = document.getElementById('cesium-container');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewType = btn.getAttribute('data-view');

            if (viewType === '2d') {
                googleMapContainer.style.display = 'block';
                cesiumContainer.style.display = 'none';
                if (streetView) streetView.setVisible(false);
                if (map) map.setZoom(13);
            } else if (viewType === '3d') {
                googleMapContainer.style.display = 'none';
                cesiumContainer.style.display = 'block';
                // Trigger resize to ensure Cesium renders correctly after being hidden
                if (cesiumViewer) cesiumViewer.resize();
            } else if (viewType === 'street') {
                googleMapContainer.style.display = 'block';
                cesiumContainer.style.display = 'none';
                if (streetView) {
                    streetView.setVisible(true);
                    streetView.setPosition(INITIAL_COORDS); // Reset to center
                }
            }
        });
    });
}

// Action Buttons Logic (.BG_red, .BG_blue, .BG_darkred)
function setupActionButtons() {
    
    // Red (Heart) Button
    const heartBtn = document.querySelector('.BG_red');
    if (heartBtn) {
        heartBtn.addEventListener('click', () => {
            heartBtn.classList.toggle('liked');
            if (heartBtn.classList.contains('liked')) {
                alert("찜 목록에 저장됨");
            }
        });
    }

    // Blue (Plus) Button
    const plusBtn = document.querySelector('.BG_blue');
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            addPlan(LOCATION_NAME);
        });
    }

    // Dark Red (Close) Button
    const closeBtn = document.querySelector('.BG_darkred');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log("Recommendation rejected. Requesting new place...");
            // Logic to fetch new place would go here
        });
    }
}

// Plan List Logic
function addPlan(locationName) {
    const list = document.getElementById('current_plans');
    if (!list) return;

    // SVG Icon for the plan
    const closeIcon = `
    <svg width="64px" height="64px" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
        <g stroke-width="0"></g>
        <g stroke-linecap="round" stroke-linejoin="round"></g>
        <g> 
            <path d="M19 5L4.99998 19M5.00001 5L19 19" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> 
        </g>
    </svg>`;

    const p = document.createElement('p');
    p.innerHTML = `Plan ${planCount}: ${locationName}${closeIcon}`;
    
    // Animation for entering
    p.style.opacity = '0';
    p.style.transform = 'translateY(20px)';
    
    list.appendChild(p);
    
    // Trigger reflow for transition
    requestAnimationFrame(() => {
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
    });

    // Scroll to bottom
    list.scrollTop = list.scrollHeight;

    planCount++;
}

function setupPlanList() {
    const list = document.getElementById('current_plans');
    if (!list) return;

    // Event Delegation for removing plans
    list.addEventListener('click', (e) => {
        // Check if the click was on the SVG or inside it
        const closeBtn = e.target.closest('svg');
        
        if (closeBtn) {
            const planItem = closeBtn.closest('p');
            if (planItem) {
                // Animation for leaving
                planItem.style.opacity = '0';
                planItem.style.transform = 'translateX(50px)';
                
                setTimeout(() => {
                    planItem.remove();
                }, 300); // Wait for transition
            }
        }
    });
}

    // 4. Date Input Initialization & Logic
function initDateInputs() {
    const sYear = document.getElementById('start_year');
    const sMonth = document.getElementById('start_month');
    const sDay = document.getElementById('start_day');
    
    const eYear = document.getElementById('end_year');
    const eMonth = document.getElementById('end_month');
    const eDay = document.getElementById('end_day');

    if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) return;

    // Get Current Date in Asia/Seoul (UTC+9)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const koreaTimeDiff = 9 * 60 * 60 * 1000;
    const koreaDate = new Date(utc + koreaTimeDiff);

    const curYear = koreaDate.getFullYear();
    const curMonth = koreaDate.getMonth() + 1;
    const curDay = koreaDate.getDate();
    const maxYear = curYear + 2; // Current year + 2 years

    // Helper function to get the number of days in a month
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    // Initial Setup: Set Values to Current Date and Year Max
    sYear.value = curYear;
    sYear.max = maxYear;
    sMonth.value = curMonth;
    sDay.value = curDay;
    
    eYear.value = curYear;
    eYear.max = maxYear;
    eMonth.value = curMonth;
    eDay.value = curDay;

    // Function to update constraints
    function updateConstraints() {
        const sy = parseInt(sYear.value) || curYear;
        const sm = parseInt(sMonth.value) || 1;
        let sd = parseInt(sDay.value) || 1;

        const ey = parseInt(eYear.value) || curYear;
        const em = parseInt(eMonth.value) || 1;
        let ed = parseInt(eDay.value) || 1;

        // 1. Update Start Date Mins and Max Days
        sYear.min = curYear;
        sYear.max = maxYear;

        if (sy > curYear) {
            sMonth.min = 1;
        } else {
            sMonth.min = curMonth;
        }
        
        const maxDaysInStartMonth = getDaysInMonth(sy, sm);
        sDay.max = maxDaysInStartMonth;
        if (sd > maxDaysInStartMonth) {
            sDay.value = maxDaysInStartMonth;
            sd = maxDaysInStartMonth;
        }

        if (sy > curYear || (sy === curYear && sm > curMonth)) {
            sDay.min = 1;
        } else {
            sDay.min = curDay;
        }
        if (sd < sDay.min) {
            sDay.value = sDay.min;
            sd = sDay.min;
        }

        // 2. Update End Date Mins and Max Days based on Start Date
        eYear.min = sy;
        eYear.max = maxYear;
        
        if (ey > sy) {
            eMonth.min = 1;
        } else {
            eMonth.min = sm;
        }
        
        const maxDaysInEndMonth = getDaysInMonth(ey, em);
        eDay.max = maxDaysInEndMonth;
        if (ed > maxDaysInEndMonth) {
            eDay.value = maxDaysInEndMonth;
            ed = maxDaysInEndMonth;
        }

        if (ey > sy || (ey === sy && em > sm)) {
            eDay.min = 1;
        } else {
            eDay.min = sd;
        }
        if (ed < eDay.min) {
            eDay.value = eDay.min;
            ed = eDay.min;
        }

        // 3. Validate End Date Value >= Start Date Value
        const startDate = new Date(sy, sm - 1, sd);
        const endDate = new Date(ey, em - 1, ed);

        if (endDate < startDate) {
            eYear.value = sy;
            eMonth.value = sm;
            eDay.value = sd;
        }
    }

    // Add Event Listeners
    const inputs = [sYear, sMonth, sDay, eYear, eMonth, eDay];
    inputs.forEach(input => {
        input.addEventListener('input', updateConstraints);
        input.addEventListener('change', updateConstraints);
    });

    // Run once to set initial mins/maxs correctly
    updateConstraints();
}

// Initialize the application
setupEventListeners();

//Map Logic