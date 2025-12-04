 

const windows = {
    settings: { el: document.getElementById('window-settings'), dock: document.getElementById('dock-settings'), state: 'open' },
    schedule: { el: document.getElementById('window-schedule'), dock: document.getElementById('dock-schedule'), state: 'closed' }
};

window.windowControl = (id, action) => {
    const win = windows[id];
    if (!win) return;
    if (action === 'close') {
        win.el.style.opacity = '0'; win.el.style.pointerEvents = 'none'; win.el.style.transform = 'scale(0.9)';
        win.dock.classList.remove('active'); win.state = 'closed';
        setTimeout(() => { if(win.state === 'closed') win.el.style.display = 'none'; }, 200);
    } else if (action === 'minimize') {
        win.el.classList.add('minimized'); win.state = 'minimized';
    } else if (action === 'maximize') {
        win.el.classList.toggle('maximized');
    } else if (action === 'dock') {
        if (win.state === 'closed') {
            win.el.style.display = 'flex'; void win.el.offsetWidth; win.el.style.opacity = '1'; win.el.style.transform = 'scale(1)'; win.el.style.pointerEvents = 'auto'; win.el.classList.remove('minimized'); win.dock.classList.add('active'); win.state = 'open'; bringToFront(`window-${id}`);
            if(id === 'schedule') { setTimeout(() => { renderSchedule(); updateLinePosition(); }, 100); }
        } else if (win.state === 'minimized') {
            win.el.classList.remove('minimized'); win.state = 'open'; bringToFront(`window-${id}`);
        } else {
            win.el.classList.add('minimized'); win.state = 'minimized';
        }
    }
};

window.bringToFront = (elementId) => {
    document.querySelectorAll('.os-window').forEach(w => w.classList.remove('active-window'));
    document.getElementById(elementId).classList.add('active-window');
};

window.openScheduleWindow = () => { windowControl('schedule', 'dock'); };

let isDragging = false, startX, startY, initialLeft, initialTop, dragTarget = null, rafId = null;
document.querySelectorAll('.window-header').forEach(header => {
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.traffic-lights') || e.target.tagName === 'BUTTON') return;
        dragTarget = header.parentElement;
        if (dragTarget.classList.contains('maximized')) return;
        isDragging = true; startX = e.clientX; startY = e.clientY;
        const rect = dragTarget.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
        dragTarget.classList.add('is-dragging'); bringToFront(dragTarget.id);
    });
});
document.addEventListener('mousemove', (e) => {
    if (!isDragging || !dragTarget) return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        dragTarget.style.left = `${initialLeft + dx}px`; dragTarget.style.top = `${initialTop + dy}px`;
    });
});
document.addEventListener('mouseup', () => {
    if (isDragging && dragTarget) dragTarget.classList.remove('is-dragging');
    isDragging = false; dragTarget = null; if (rafId) cancelAnimationFrame(rafId);
});

const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const themeInput = document.getElementById('trip-theme');
const btnToPlan = document.getElementById('btn-to-plan');
const viewSettings = document.getElementById('view-settings');
const viewPlanning = document.getElementById('view-planning');
const durationBadge = document.getElementById('duration-badge');

function checkSettingsValidity() {
    if (startDate.value && endDate.value && themeInput.value.trim().length > 0) {
        btnToPlan.disabled = false; btnToPlan.classList.remove('bg-white/5', 'text-white/30', 'cursor-not-allowed', 'border-white/5'); btnToPlan.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600', 'text-white', 'shadow-emerald-500/20', 'border-transparent');
    } else {
        btnToPlan.disabled = true; btnToPlan.classList.add('bg-white/5', 'text-white/30', 'cursor-not-allowed', 'border-white/5'); btnToPlan.classList.remove('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600', 'text-white', 'shadow-emerald-500/20', 'border-transparent');
    }
}
function updateDateLogic() {
    const startVal = startDate.value; if (startVal) endDate.min = startVal;
    if (startVal && endDate.value) {
        const diff = new Date(endDate.value) - new Date(startVal);
        if (diff >= 0) {
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
            durationBadge.textContent = `${days-1} Nights ${days} Days`; durationBadge.classList.remove('hidden');
            const opts = { month: 'short', day: 'numeric' };
            document.getElementById('widget-date-range').innerText = `${new Date(startVal).toLocaleDateString('en-US', opts)} - ${new Date(endDate.value).toLocaleDateString('en-US', opts)}`;
        } else durationBadge.classList.add('hidden');
    }
    checkSettingsValidity();
}
startDate.addEventListener('change', updateDateLogic); endDate.addEventListener('change', updateDateLogic); themeInput.addEventListener('input', checkSettingsValidity);

window.goToPlanning = () => {
    viewSettings.classList.add('hidden-view');
    setTimeout(() => { viewSettings.style.display = 'none'; viewPlanning.style.display = 'flex'; void viewPlanning.offsetWidth; viewPlanning.classList.remove('hidden-view'); }, 300);
    if(windows.schedule.state === 'closed') windowControl('schedule', 'dock');
};
window.backToSettings = () => {
    viewPlanning.classList.add('hidden-view');
    setTimeout(() => { viewPlanning.style.display = 'none'; viewSettings.style.display = 'flex'; void viewSettings.offsetWidth; viewSettings.classList.remove('hidden-view'); }, 300);
};

window.setPlanMode = (mode) => {
    const smartBtn = document.getElementById('mode-smart'); const customBtn = document.getElementById('mode-custom');
    const smartPanel = document.getElementById('panel-smart'); const customPanel = document.getElementById('panel-custom');
    if (mode === 'smart') {
        smartBtn.className = 'tab-btn active'; customBtn.className = 'tab-btn inactive';
        smartPanel.classList.remove('hidden'); customPanel.classList.add('hidden');
    } else {
        smartBtn.className = 'tab-btn inactive'; customBtn.className = 'tab-btn active';
        smartPanel.classList.add('hidden'); customPanel.classList.remove('hidden');
    }
};

let currentSelectedPlace = null, pendingPlanItem = null;
const searchInput = document.getElementById('place_search');
const resultsDiv = document.getElementById('autocomplete_results');
const btnSmartGen = document.getElementById('btn-smart-gen');
const btnCustomAdd = document.getElementById('btn-custom-add');

searchInput.addEventListener('input', async (e) => {
    const val = e.target.value; if (val.length < 2) { resultsDiv.classList.add('hidden'); return; }
    const { AutocompleteService } = await google.maps.importLibrary("places");
    const service = new AutocompleteService();
    service.getPlacePredictions({ input: val, componentRestrictions: { country: 'jp' } }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resultsDiv.innerHTML = ''; resultsDiv.classList.remove('hidden');
            predictions.forEach(p => {
                const div = document.createElement('div');
                div.className = 'p-4 hover:bg-white/10 cursor-pointer border-b border-white/5 text-sm text-white/90 flex items-center gap-3 transition-colors';
                div.innerHTML = `<i class="fa-solid fa-location-dot text-white/40"></i> <span>${p.description}</span>`;
                div.onclick = () => selectPlace(p);
                resultsDiv.appendChild(div);
            });
        }
    });
});

async function selectPlace(place) {
    searchInput.value = place.description; resultsDiv.classList.add('hidden'); currentSelectedPlace = place;
    const { PlacesService } = await google.maps.importLibrary("places");
    const placesService = new PlacesService(document.createElement('div'));
    placesService.getDetails({ placeId: place.place_id }, (detail, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            currentSelectedPlace.details = detail; updateDestWidget(detail);
            if(map) map.flyCameraTo({ endCamera: { center: { lat: detail.geometry.location.lat(), lng: detail.geometry.location.lng(), altitude: 0 }, range: 1000, tilt: 0, heading: 0 }, durationMillis: 2000 });
        }
    });
    btnSmartGen.disabled = false; btnSmartGen.classList.remove('opacity-50', 'cursor-not-allowed');
    btnCustomAdd.disabled = false; btnCustomAdd.classList.remove('opacity-50', 'cursor-not-allowed');
}

function updateDestWidget(detail) {
    document.getElementById('dest-name').innerText = detail.name;
    const imgEl = document.getElementById('dest-image');
    if (detail.photos && detail.photos.length > 0) imgEl.src = detail.photos[0].getUrl({ maxWidth: 600 });
    else imgEl.src = 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop';
}

window.triggerPreview = async (type) => {
    if (!currentSelectedPlace || !currentSelectedPlace.details) return;
    const previewWidget = document.getElementById('preview-widget');
    const destWidget = document.getElementById('dest-info-widget');
    destWidget.style.display = 'none'; previewWidget.classList.remove('hidden-view', 'translate-x-10');
    document.getElementById('preview-title').innerText = "Analyzing..."; document.getElementById('btn-confirm-add').disabled = true;

    let name, category, duration, desc;
    if (type === 'ai') {
        const reqText = document.getElementById('plan-req').value;
        const themeText = document.getElementById('trip-theme').value || "Smart Plan";
        const cityContext = currentSelectedPlace ? currentSelectedPlace.details.formatted_address : "Tokyo, Japan";
        
        try {
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    city: cityContext, 
                    theme: themeText, 
                    requirements: reqText 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                const data = result.data;
                updatePreviewUI(data.name, data.category, 2, data.reason, data);
            } else {
                alert("AI Error: " + (result.error || "Unknown error"));
                resetPreviewUI();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to AI server.");
            resetPreviewUI();
        }
    } else {
        // [MODIFIED] Custom Logic with Text Input
        name = document.getElementById('custom-name').value || currentSelectedPlace.details.name;
        category = document.getElementById('custom-category').value; // Text Value
        duration = parseFloat(document.getElementById('custom-duration').value) || 2;
        desc = "User created custom activity plan.";
        updatePreviewUI(name, category, duration, desc);
    }
};

function updatePreviewUI(name, category, duration, desc, aiData = null) {
    let lat, lng;
    if (aiData && aiData.location) {
        lat = aiData.location.lat;
        lng = aiData.location.lng;
    } else if (currentSelectedPlace && currentSelectedPlace.details) {
        lat = currentSelectedPlace.details.geometry.location.lat();
        lng = currentSelectedPlace.details.geometry.location.lng();
    } else {
        return; 
    }

    // Safety check for coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.error("Invalid coordinates:", lat, lng);
        return;
    }

    pendingPlanItem = { id: Date.now().toString(), name: name, duration: duration, category: category, coords: { lat: lat, lng: lng } };
    
    // UI Updates
    document.getElementById('preview-title').innerText = name;
    document.getElementById('preview-desc').innerText = desc;
    document.getElementById('preview-duration').innerText = `${duration}h`;

    // Category
    document.getElementById('preview-category').innerText = category;

    // Rating
    const ratingEl = document.getElementById('preview-rating');
    ratingEl.innerHTML = '';
    if (aiData && aiData.rating) {
        const r = Math.round(aiData.rating);
        for(let i=0; i<5; i++) {
            const star = document.createElement('i');
            star.className = i < r ? 'fa-solid fa-star' : 'fa-regular fa-star';
            ratingEl.appendChild(star);
        }
        const score = document.createElement('span');
        score.className = 'text-white/60 ml-1';
        score.innerText = aiData.rating;
        ratingEl.appendChild(score);
    }

    // Keywords
    const kwEl = document.getElementById('preview-keywords');
    kwEl.innerHTML = '';
    if (aiData && aiData.keywords) {
        aiData.keywords.forEach(k => {
            const span = document.createElement('span');
            span.className = 'px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/70';
            span.innerText = `#${k}`;
            kwEl.appendChild(span);
        });
    }

    // Route Context
    const routeCtx = document.getElementById('route-context');
    if (scheduleState.activities.length > 0) {
        const lastItem = scheduleState.activities[scheduleState.activities.length - 1];
        const dist = calculateDistance(lastItem.coords.lat, lastItem.coords.lng, lat, lng);
        const time = Math.round((dist / 30) * 60); // Approx 30km/h city travel
        routeCtx.querySelector('span').innerText = `+${time} min from last spot`;
        routeCtx.classList.remove('hidden');
    } else {
        routeCtx.classList.add('hidden');
    }

    // Image
    const prevImg = document.getElementById('preview-image');
    if (aiData && aiData.photos && aiData.photos.length > 0) {
        const photoName = aiData.photos[0].name;
        prevImg.src = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_MAPS_API_KEY}&maxWidthPx=800`;
        prevImg.classList.remove('opacity-0');
    } else if (currentSelectedPlace && currentSelectedPlace.details.photos) { 
        prevImg.src = currentSelectedPlace.details.photos[0].getUrl({ maxWidth: 800 }); 
        prevImg.classList.remove('opacity-0'); 
    }

    // Map Interaction
    if (map) {
        map.flyCameraTo({ 
            endCamera: { 
                center: { lat: lat, lng: lng, altitude: 500 }, 
                tilt: 45, 
                heading: 0 
            }, 
            durationMillis: 2000 
        });
        
        const existingMarker = document.getElementById('preview-marker');
        if(existingMarker) existingMarker.remove();

        const marker = document.createElement('gmp-marker-3d');
        marker.id = 'preview-marker';
        marker.setAttribute('position', `${lat},${lng}`);
        map.append(marker);
    }

    document.getElementById('btn-confirm-add').disabled = false;
}

window.confirmAddToPlan = () => { if(pendingPlanItem) { scheduleState.activities.push(pendingPlanItem); renderSchedule(); resetPreviewUI(); } };
window.rejectPreview = () => { pendingPlanItem = null; resetPreviewUI(); };
window.regeneratePreview = () => { triggerPreview('ai'); };

function resetPreviewUI() {
    const previewWidget = document.getElementById('preview-widget');
    const destWidget = document.getElementById('dest-info-widget');
    previewWidget.classList.add('hidden-view', 'translate-x-10');
    setTimeout(() => { destWidget.style.display = 'block'; }, 300);
    searchInput.value = '';
    document.getElementById('plan-req').value = '';
    document.getElementById('custom-name').value = '';
    currentSelectedPlace = null;
    
    const marker = document.getElementById('preview-marker');
    if(marker) marker.remove();
}

/* =========================================
    5. Schedule Logic (Stable Timeline)
    ========================================= */
const Icons = {
    plane: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="m13 2 9 10-9 10"/><path d="M5.5 12h-3.5"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    grip: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
};

const MAX_HOURS = 10;
let scheduleState = {
    activities: [
        { id: '1', name: 'National Museum', duration: 3, category: 'art', coords: { lat: 35.7189, lng: 139.7757 } },
        { id: '2', name: 'Central Park', duration: 2, category: 'nature', coords: { lat: 35.7140, lng: 139.7741 } },
        { id: '3', name: 'City Temple', duration: 2, category: 'culture', coords: { lat: 35.7147, lng: 139.7967 } },
        { id: '4', name: 'Skytree View', duration: 3, category: 'view', coords: { lat: 35.7100, lng: 139.8107 } },
    ],
    draggedItemIndex: null,
    gapDistances: {}
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; const dLat = (lat2 - lat1) * (Math.PI/180); const dLon = (lon2 - lon1) * (Math.PI/180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c * 1.3; 
}

function createStartNode() {
    return `<div class="flex w-full group relative mb-6 pt-4">
        <div class="w-14 flex-shrink-0 relative flex justify-center items-center">
        <div id="start-dot" class="w-3 h-3 rounded-full bg-emerald-500/20 border-emerald-500/30 border shadow z-10 flex items-center justify-center">
        <div class="w-1 h-1 rounded-full bg-emerald-400"></div></div></div><div class="flex-1 pr-1">
        <div class="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center justify-between w-full shadow-sm">
        <div class="flex items-center gap-4">
        <div class="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">${Icons.plane}</div><div class="flex flex-col"><span class="text-sm font-bold text-white/90">Incheon</span><span class="text-[10px] text-white/40 uppercase">Departure</span></div></div><span class="text-xs text-white/30 font-mono">10:00 AM</span></div></div></div>`;
}
function createEndNode() {
    return `<div class="flex w-full group relative mb-6 mt-32 pb-8"><div class="w-14 flex-shrink-0 relative flex justify-center items-center"><div id="end-dot" class="w-3 h-3 rounded-full bg-rose-500/20 border-rose-500/30 border shadow z-10 flex items-center justify-center"><div class="w-1 h-1 rounded-full bg-rose-400"></div></div></div><div class="flex-1 pr-1"><div class="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm flex items-center justify-between w-full shadow-sm"><div class="flex items-center gap-4"><div class="p-2 rounded-xl bg-rose-500/20 text-rose-400">${Icons.check}</div><div class="flex flex-col"><span class="text-sm font-bold text-white/90">Incheon</span><span class="text-[10px] text-white/40 uppercase">Arrival</span></div></div><span class="text-xs text-white/30 font-mono">08:00 PM</span></div></div></div>`;
}
function createActivityItem(item, index) {
    return `<div class="activity-item flex w-full relative group transition-all duration-300 ease-out mb-2" draggable="true" data-index="${index}"><div class="w-14 flex-shrink-0 relative"><div class="absolute left-[50%] top-1/2 w-[50%] h-px bg-white/20 pointer-events-none"></div><div class="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800 border border-white/30 z-10 group-hover:bg-sky-400 group-hover:border-sky-400 transition-colors"></div></div><div class="flex-1 pr-1 min-w-0"><div class="glass-panel relative p-4 pl-5 rounded-2xl flex items-center gap-4 cursor-grab active:cursor-grabbing transform transition-all group-hover:translate-x-1 hover:bg-white/10 hover:shadow-lg"><div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white/90 transition-colors">${Icons.mapPin}</div><div class="flex-1 min-w-0"><h3 class="text-base font-medium text-white/95 truncate pointer-events-none">${item.name}</h3><span class="text-[11px] text-white/30 uppercase tracking-wider pointer-events-none">${item.category}</span></div><div class="pr-3 border-l border-white/5 pl-4 flex flex-col items-center min-w-[3.5rem] pointer-events-none"><span class="text-lg font-light text-white/80">${item.duration}<span class="text-[10px] ml-0.5 opacity-50">h</span></span></div><div class="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 text-white transition-opacity">${Icons.grip}</div></div></div></div>`;
}

function renderSchedule() {
    const listContainer = document.getElementById('schedule-list');
    if(!listContainer) return;
    let html = `<div id="timeline-guide" class="absolute left-7 w-px bg-white/20 z-0 transition-all duration-300 rounded-full"></div>`;
    html += createStartNode();

    let days = []; let currentDayItems = []; let currentHours = 0; let dayCount = 1;
    scheduleState.activities.forEach(item => {
        if(currentHours + item.duration > MAX_HOURS) {
            days.push({ day: dayCount, items: currentDayItems, hours: currentHours });
            dayCount++; currentDayItems = []; currentHours = 0;
        }
        currentDayItems.push(item); currentHours += item.duration;
    });
    if(currentDayItems.length > 0) days.push({ day: dayCount, items: currentDayItems, hours: currentHours });

    let globalIndex = 0; let connectors = [];
    days.forEach(day => {
        const percent = (day.hours / MAX_HOURS) * 100;
        const color = percent >= 100 ? 'bg-rose-400' : 'bg-sky-400';
        html += `<div class="flex w-full h-14 items-center relative mt-10 mb-4"><div class="w-14 flex-shrink-0 relative flex justify-center items-center"></div><div class="flex-1 pr-1 flex items-center justify-between"><h2 class="text-xl font-bold text-white tracking-wide ml-1 drop-shadow-md">Day ${day.day}</h2><div class="flex items-center gap-3 bg-black/20 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md"><div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full transition-all duration-500 ease-out ${color}" style="width: ${Math.min(percent, 100)}%"></div></div><span class="text-xs text-sky-200/60 font-mono">${day.hours}h</span></div></div></div>`;
        
        day.items.forEach((item, idx) => {
            const realIndex = scheduleState.activities.findIndex(a => a.id === item.id);
            html += createActivityItem(item, realIndex);
            if (idx < day.items.length - 1) {
                const nextItem = day.items[idx + 1];
                const dist = calculateDistance(item.coords.lat, item.coords.lng, nextItem.coords.lat, nextItem.coords.lng);
                const cId = `gap-${globalIndex}`;
                html += `<div class="flex w-full items-center justify-end pl-14 pr-1 py-2 opacity-90 h-10 relative"><div class="flex-1 dashed-line mr-3 opacity-30"></div><div id="connector-${cId}" class="connector-badge relative flex items-center justify-center h-7 bg-slate-800/60 border border-white/10 rounded-full shadow-lg backdrop-blur-md overflow-hidden transition-all duration-500 ease-out" style="width: 70px;"><div class="absolute left-0 top-0 bottom-0 bg-sky-500/10 w-full"></div><span class="text-xs text-sky-200 font-mono font-bold tracking-wider font-numeric relative z-10">0m</span></div><div class="flex-1 dashed-line ml-3 opacity-30"></div></div>`;
                connectors.push({ id: cId, val: dist, index: globalIndex });
                globalIndex++;
            }
        });
    });

    html += createEndNode();
    listContainer.innerHTML = html;

    connectors.forEach(c => {
        const el = document.getElementById(`connector-${c.id}`);
        const span = el.querySelector('span');
        const startDist = scheduleState.gapDistances[c.index] || 0;
        const targetDist = c.val;
        if(el) {
            const minW = 70; const maxW = 240;
            const startW = Math.min(maxW, minW + (startDist * 12));
            const targetW = Math.min(maxW, minW + (targetDist * 12));
            el.style.width = `${startW}px`;
            requestAnimationFrame(() => el.style.width = `${targetW}px`);
        }
        animateValue(span, startDist, targetDist, 600);
        scheduleState.gapDistances[c.index] = targetDist;
    });

    attachDragEvents();
    requestAnimationFrame(updateLinePosition);
}

function animateValue(obj, start, end, duration) {
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = start + (end - start) * (1 - Math.pow(1 - progress, 3));
        if (currentVal < 1) obj.innerHTML = `${Math.round(currentVal * 1000)}m`;
        else obj.innerHTML = `${currentVal.toFixed(1)}km`;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function attachDragEvents() {
    const items = document.querySelectorAll('.activity-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', e => e.preventDefault());
    });
}
function handleDragStart(e) {
    scheduleState.draggedItemIndex = Number(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragEnter(e) {
    e.preventDefault();
    const targetIndex = Number(this.dataset.index);
    if (scheduleState.draggedItemIndex === null || scheduleState.draggedItemIndex === targetIndex) return;
    const newItems = [...scheduleState.activities];
    const item = newItems.splice(scheduleState.draggedItemIndex, 1)[0];
    newItems.splice(targetIndex, 0, item);
    scheduleState.activities = newItems;
    scheduleState.draggedItemIndex = targetIndex;
    renderSchedule();
}
function handleDragEnd(e) {
    this.classList.remove('dragging');
    scheduleState.draggedItemIndex = null;
    renderSchedule();
}
function updateLinePosition() {
    const startDot = document.getElementById('start-dot');
    const endDot = document.getElementById('end-dot');
    const guideLine = document.getElementById('timeline-guide');
    const listContainer = document.getElementById('schedule-list'); 

    if (startDot && endDot && guideLine && listContainer) {
        const listRect = listContainer.getBoundingClientRect();
        const startRect = startDot.getBoundingClientRect();
        const endRect = endDot.getBoundingClientRect();
        
        // Calculate offsets relative to the listContainer
        const startTop = (startRect.top + startRect.height / 2) - listRect.top;
        const endTop = (endRect.top + endRect.height / 2) - listRect.top;
        
        const height = endTop - startTop;
        
        if (height > 0) {
            guideLine.style.top = `${startTop}px`;
            guideLine.style.height = `${height}px`;
            guideLine.style.display = 'block';
        } else {
            guideLine.style.display = 'none';
        }
    }
}

window.addEventListener('resize', updateLinePosition);
document.getElementById('schedule-container').addEventListener('scroll', updateLinePosition);

// Map Init
let map;
async function initMap() {
    await google.maps.importLibrary("maps3d");
    map = document.createElement('gmp-map-3d');
    map.setAttribute('center', '35.6895,139.6917'); 
    map.setAttribute('tilt', '0');
    map.setAttribute('range', '2000');
    map.setAttribute('heading', '30');
    map.setAttribute('mode', 'hybrid');
    document.getElementById('map-container').append(map);
}
initMap();

let isWidgetsVisible = true;
window.toggleWidgets = () => {
    isWidgetsVisible = !isWidgetsVisible;
    const widget = document.getElementById('desktop-widget');
    const icon = document.getElementById('dock-widget');
    if (isWidgetsVisible) {
        widget.classList.remove('hidden-widget');
        icon.classList.add('active');
    } else {
        widget.classList.add('hidden-widget');
        icon.classList.remove('active');
    }
};

const today = new Date().toISOString().split('T')[0];
document.getElementById('start-date').value = today;
document.getElementById('end-date').value = today;
updateDateLogic();
