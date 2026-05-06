const sounds = {
    nature: [
        {id:'rain',emoji:'🌧️',name:'Rain',desc:'Steady rainfall on a window'},
        {id:'thunder',emoji:'⛈️',name:'Thunder',desc:'Rain with distant thunder'},
        {id:'forest',emoji:'🌲',name:'Forest',desc:'Birds and rustling leaves'},
        {id:'waves',emoji:'🌊',name:'Ocean',desc:'Gentle ocean waves'}
    ],
    urban: [
        {id:'cafe',emoji:'☕',name:'Coffee Shop',desc:'Murmurs and espresso'},
        {id:'library',emoji:'📚',name:'Library',desc:'Quiet pages and steps'}
    ],
    focus: [
        {id:'whitenoise',emoji:'〰️',name:'White Noise',desc:'Pure white noise'},
        {id:'brownnoise',emoji:'🟤',name:'Brown Noise',desc:'Deep, warm noise'}
    ]
};

const presets = {
    deepfocus: ['whitenoise', 'brownnoise'],
    cafe: ['cafe', 'rain'],
    nature: ['forest', 'waves']
};

let activeSounds = new Set();
let audioElements = {}; // Stores actual Audio objects
let volumes = {};
let eqInterval = null;

// Initialize Audio Objects (Call this on first click)
function initAudio(id) {
    if (!audioElements[id]) {
        // Replace with your actual hosted audio paths
        audioElements[id] = new Audio(`sounds/${id}.mp3`); 
        audioElements[id].loop = true;
        audioElements[id].volume = (volumes[id] || 50) / 100;
    }
}

function renderSounds(type) {
    const container = document.getElementById(type + 'Sounds');
    if (!container) return;
    
    container.innerHTML = sounds[type].map(s => `
        <div class="sound-card" id="card-${s.id}" onclick="toggleSound('${s.id}')">
            <div class="active-indicator"></div>
            <span class="sound-emoji">${s.emoji}</span>
            <div class="sound-name">${s.name}</div>
            <div class="sound-desc">${s.desc}</div>
            <div class="sound-volume-wrap">
                <input type="range" class="sound-vol-slider" id="vol-${s.id}" 
                    min="0" max="100" value="50"
                    onclick="event.stopPropagation()" 
                    oninput="setVolume('${s.id}', this.value)">
                <span class="sound-vol-label" id="vol-label-${s.id}">50%</span>
            </div>
        </div>
    `).join('');
}

function toggleSound(id) {
    const card = document.getElementById('card-' + id);
    initAudio(id); // Ensure audio object exists

    if (activeSounds.has(id)) {
        activeSounds.delete(id);
        card.classList.remove('active');
        audioElements[id].pause();
    } else {
        activeSounds.add(id);
        card.classList.add('active');
        audioElements[id].play();
    }
    updateNowPlaying();
}

function setVolume(id, val) {
    volumes[id] = val;
    if (audioElements[id]) {
        audioElements[id].volume = val / 100;
    }
    document.getElementById('vol-label-' + id).textContent = val + '%';
}

function updateNowPlaying() {
    const active = [...activeSounds];
    const npTitle = document.getElementById('npTitle');
    const npStatus = document.getElementById('npStatus');

    if (active.length === 0) {
        npTitle.textContent = 'No sound playing';
        npStatus.textContent = 'Select a sound to begin';
        stopEQ();
    } else {
        const allSoundsList = Object.values(sounds).flat();
        const names = active.map(id => allSoundsList.find(s => s.id === id)?.name);
        npTitle.textContent = names.join(' + ');
        npStatus.textContent = `${active.length} sound${active.length > 1 ? 's' : ''} active`;
        startEQ();
    }
}

function startEQ() {
    if (eqInterval) return;
    const bars = document.querySelectorAll('.eq-bar');
    eqInterval = setInterval(() => {
        bars.forEach(bar => {
            const height = Math.floor(Math.random() * 80) + 20;
            bar.style.height = `${height}%`;
        });
    }, 150);
}

function stopEQ() {
    clearInterval(eqInterval);
    eqInterval = null;
    document.querySelectorAll('.eq-bar').forEach(bar => bar.style.height = '5%');
}

function clearAll() {
    activeSounds.forEach(id => {
        if (audioElements[id]) audioElements[id].pause();
    });
    activeSounds.clear();
    document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active'));
    updateNowPlaying();
}
