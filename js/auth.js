// ============================================================
// auth.js — Centralized Browser-Only Account System
// Must be loaded BEFORE any page-specific scripts.
// ============================================================

// ── Global appData object ──────────────────────────────────
let appData = null;

// ── Default empty user template ────────────────────────────
function createEmptyUserData(username, hashedPin) {
    return {
        username: username,
        pin: hashedPin,
        tasks: [],
        sessions: [],
        achievements: [],
        notes: [],
        xp: 0,
        weeklyCompletedTasks: {},
        stats: {
            completedTasks: 0,
            totalFocusTime: 0,
            streak: 0
        },
        analytics: {
            dailyProgress: [],
            weeklyStats: []
        }
    };
}

// ── Initialization ─────────────────────────────────────────
function initAppData() {
    try {
        var raw = localStorage.getItem('appData');
        if (raw) {
            appData = JSON.parse(raw);
        }
    } catch (e) {
        appData = null;
    }

    if (!appData || typeof appData !== 'object' || !appData.users) {
        appData = {
            currentUser: null,
            users: {}
        };
        saveData();
    }
}

// ── Save ───────────────────────────────────────────────────
function saveData() {
    localStorage.setItem('appData', JSON.stringify(appData));
}

// ── SHA-256 Hashing ────────────────────────────────────────
async function hashPin(pin) {
    var encoder = new TextEncoder();
    var data = encoder.encode(pin);
    var hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
}

// ── Get Current User ───────────────────────────────────────
function getCurrentUser() {
    if (!appData || !appData.currentUser) return null;
    return appData.users[appData.currentUser] || null;
}

// ── Create Account ─────────────────────────────────────────
async function createAccount(username, email, pin) {
    username = (username || '').trim();
    email = (email || '').trim().toLowerCase();
    pin = (pin || '').trim();

    if (!username || !email || !pin) {
        return { success: false, message: 'All fields are required.' };
    }
    if (!email.includes('@') || !email.includes('.')) {
        return { success: false, message: 'Please enter a valid email.' };
    }
    if (pin.length < 4) {
        return { success: false, message: 'PIN must be at least 4 characters.' };
    }
    if (appData.users[email]) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    var hashedPin = await hashPin(pin);
    appData.users[email] = createEmptyUserData(username, hashedPin);
    appData.currentUser = email;
    saveData();
    return { success: true, message: 'Account created successfully!' };
}

// ── Login ──────────────────────────────────────────────────
async function loginUser(email, pin) {
    email = (email || '').trim().toLowerCase();
    pin = (pin || '').trim();

    if (!email || !pin) {
        return { success: false, message: 'Email and PIN are required.' };
    }

    var user = appData.users[email];
    if (!user) {
        return { success: false, message: 'No account found with this email.' };
    }

    var hashedPin = await hashPin(pin);
    if (hashedPin !== user.pin) {
        return { success: false, message: 'Incorrect PIN.' };
    }

    appData.currentUser = email;
    saveData();
    return { success: true, message: 'Login successful!' };
}

// ── Logout ─────────────────────────────────────────────────
function logoutUser() {
    appData.currentUser = null;
    saveData();
    checkAuthGate();
}

// ── Switch User ────────────────────────────────────────────
async function switchUser(email, pin) {
    return await loginUser(email, pin);
}

// ── Auth Gate (show/hide overlay) ──────────────────────────
function checkAuthGate() {
    var overlay = document.getElementById('authOverlay');
    var switchModal = document.getElementById('switchUserModal');

    if (!overlay) return;

    if (!appData.currentUser || !appData.users[appData.currentUser]) {
        // Not logged in — show overlay, hide app
        overlay.classList.add('active');
        document.body.classList.add('auth-locked');
        if (switchModal) switchModal.classList.remove('active');
    } else {
        // Logged in — hide overlay, show app
        overlay.classList.remove('active');
        document.body.classList.remove('auth-locked');
        updateUsernameDisplay();
    }
}

// ── Update Sidebar Username Display ────────────────────────
function updateUsernameDisplay() {
    var user = getCurrentUser();
    if (!user) return;

    // Update all .username elements in sidebar
    var usernameEls = document.querySelectorAll('.sidebar .username');
    usernameEls.forEach(function (el) {
        el.textContent = user.username;
    });

    // Update user-level to show email
    var levelEls = document.querySelectorAll('.sidebar .user-level');
    levelEls.forEach(function (el) {
        el.textContent = appData.currentUser;
    });
}

// ── Render Auth UI (Login/Signup Overlay + Switch Modal + Sidebar Buttons) ──
function renderAuthUI() {
    // ─── 1. Login / Signup Overlay ───
    var overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = '\
    <div class="auth-card">\
        <div class="auth-logo">\
            <i class="fas fa-graduation-cap"></i>\
            <span>StudyHub Pro</span>\
        </div>\
        <div class="auth-tabs">\
            <button class="auth-tab active" data-tab="login" onclick="switchAuthTab(\'login\')">Login</button>\
            <button class="auth-tab" data-tab="signup" onclick="switchAuthTab(\'signup\')">Sign Up</button>\
        </div>\
        <div class="auth-error" id="authError"></div>\
        <form id="authForm" onsubmit="return false;">\
            <div class="auth-field auth-signup-only" style="display:none;">\
                <label for="authUsername"><i class="fas fa-user"></i> Username</label>\
                <input type="text" id="authUsername" placeholder="Enter display name" autocomplete="off">\
            </div>\
            <div class="auth-field">\
                <label for="authEmail"><i class="fas fa-envelope"></i> Email</label>\
                <input type="email" id="authEmail" placeholder="Enter your email" autocomplete="off">\
            </div>\
            <div class="auth-field">\
                <label for="authPin"><i class="fas fa-lock"></i> PIN</label>\
                <input type="password" id="authPin" placeholder="Enter your PIN" autocomplete="off">\
            </div>\
            <button type="submit" class="auth-submit-btn" id="authSubmitBtn">\
                <i class="fas fa-sign-in-alt"></i> Login\
            </button>\
        </form>\
        <div class="auth-footer">\
            <span class="auth-footer-text" id="authFooterText">Don\'t have an account?</span>\
            <button class="auth-footer-link" id="authFooterLink" onclick="switchAuthTab(\'signup\')">Sign Up</button>\
        </div>\
    </div>';
    document.body.appendChild(overlay);

    // ─── 2. Switch User Modal ───
    var switchModal = document.createElement('div');
    switchModal.id = 'switchUserModal';
    switchModal.className = 'switch-modal-overlay';
    switchModal.innerHTML = '\
    <div class="switch-modal">\
        <div class="switch-modal-header">\
            <h3><i class="fas fa-users"></i> Switch User</h3>\
            <button class="switch-modal-close" onclick="closeSwitchModal()"><i class="fas fa-times"></i></button>\
        </div>\
        <div class="switch-modal-body" id="switchUserList"></div>\
        <div class="switch-pin-section" id="switchPinSection" style="display:none;">\
            <div class="auth-error" id="switchError"></div>\
            <p class="switch-selected-user" id="switchSelectedUser"></p>\
            <div class="auth-field">\
                <label for="switchPin"><i class="fas fa-lock"></i> Enter PIN</label>\
                <input type="password" id="switchPin" placeholder="Enter PIN to switch">\
            </div>\
            <button class="auth-submit-btn" id="switchConfirmBtn" onclick="confirmSwitchUser()">\
                <i class="fas fa-exchange-alt"></i> Switch\
            </button>\
        </div>\
    </div>';
    document.body.appendChild(switchModal);

    // ─── 3. Inject Sidebar Buttons ───
    var sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
        var authButtons = document.createElement('div');
        authButtons.className = 'sidebar-auth-buttons';
        authButtons.innerHTML = '\
        <button class="sidebar-auth-btn" onclick="openSwitchModal()" title="Switch User">\
            <i class="fas fa-users"></i>\
        </button>\
        <button class="sidebar-auth-btn sidebar-logout-btn" onclick="logoutUser()" title="Logout">\
            <i class="fas fa-sign-out-alt"></i>\
        </button>';
        sidebarFooter.appendChild(authButtons);
    }

    // ─── 4. Bind Form Submit ───
    var authForm = document.getElementById('authForm');
    authForm.addEventListener('submit', handleAuthSubmit);

    // Allow Enter key on PIN field
    document.getElementById('authPin').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAuthSubmit(e);
        }
    });

    document.getElementById('switchPin').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmSwitchUser();
        }
    });
}

// ── Auth Tab Switching ─────────────────────────────────────
var currentAuthTab = 'login';

function switchAuthTab(tab) {
    currentAuthTab = tab;
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });

    var signupFields = document.querySelectorAll('.auth-signup-only');
    signupFields.forEach(function (f) {
        f.style.display = tab === 'signup' ? 'flex' : 'none';
    });

    var submitBtn = document.getElementById('authSubmitBtn');
    var footerText = document.getElementById('authFooterText');
    var footerLink = document.getElementById('authFooterLink');

    if (tab === 'signup') {
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        footerText.textContent = 'Already have an account?';
        footerLink.textContent = 'Login';
        footerLink.setAttribute('onclick', "switchAuthTab('login')");
    } else {
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        footerText.textContent = "Don't have an account?";
        footerLink.textContent = 'Sign Up';
        footerLink.setAttribute('onclick', "switchAuthTab('signup')");
    }

    // Clear errors
    document.getElementById('authError').textContent = '';
    document.getElementById('authError').style.display = 'none';
}

// ── Handle Form Submission ─────────────────────────────────
async function handleAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    var errorEl = document.getElementById('authError');
    var email = document.getElementById('authEmail').value;
    var pin = document.getElementById('authPin').value;

    var result;

    if (currentAuthTab === 'signup') {
        var username = document.getElementById('authUsername').value;
        result = await createAccount(username, email, pin);
    } else {
        result = await loginUser(email, pin);
    }

    if (result.success) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
        // Clear form
        document.getElementById('authEmail').value = '';
        document.getElementById('authPin').value = '';
        var usernameInput = document.getElementById('authUsername');
        if (usernameInput) usernameInput.value = '';
        checkAuthGate();
        // Dispatch event so page-specific scripts can reload data
        window.dispatchEvent(new CustomEvent('userChanged'));
    } else {
        errorEl.textContent = result.message;
        errorEl.style.display = 'block';
    }
}

// ── Switch User Modal Functions ────────────────────────────
var switchTargetEmail = null;

function openSwitchModal() {
    var modal = document.getElementById('switchUserModal');
    var listEl = document.getElementById('switchUserList');
    var pinSection = document.getElementById('switchPinSection');
    var errorEl = document.getElementById('switchError');

    switchTargetEmail = null;
    pinSection.style.display = 'none';
    errorEl.style.display = 'none';
    errorEl.textContent = '';

    // Build user list
    var emails = Object.keys(appData.users);
    if (emails.length === 0) {
        listEl.innerHTML = '<p class="switch-empty">No accounts found.</p>';
    } else {
        listEl.innerHTML = emails.map(function (email) {
            var user = appData.users[email];
            var isCurrent = email === appData.currentUser;
            return '<button class="switch-user-item ' + (isCurrent ? 'current' : '') + '" onclick="selectSwitchUser(\'' + email + '\')" ' + (isCurrent ? 'disabled' : '') + '>' +
                '<div class="switch-user-avatar"><i class="fas fa-user"></i></div>' +
                '<div class="switch-user-info">' +
                    '<span class="switch-user-name">' + user.username + '</span>' +
                    '<span class="switch-user-email">' + email + '</span>' +
                '</div>' +
                (isCurrent ? '<span class="switch-current-badge">Current</span>' : '<i class="fas fa-chevron-right switch-arrow"></i>') +
            '</button>';
        }).join('');
    }

    modal.classList.add('active');
}

function closeSwitchModal() {
    var modal = document.getElementById('switchUserModal');
    modal.classList.remove('active');
    switchTargetEmail = null;
}

function selectSwitchUser(email) {
    switchTargetEmail = email;
    var user = appData.users[email];
    var pinSection = document.getElementById('switchPinSection');
    var selectedEl = document.getElementById('switchSelectedUser');
    var errorEl = document.getElementById('switchError');

    selectedEl.innerHTML = '<i class="fas fa-user-circle"></i> Switching to <strong>' + user.username + '</strong>';
    document.getElementById('switchPin').value = '';
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    pinSection.style.display = 'block';
    document.getElementById('switchPin').focus();
}

async function confirmSwitchUser() {
    if (!switchTargetEmail) return;

    var pin = document.getElementById('switchPin').value;
    var errorEl = document.getElementById('switchError');

    var result = await switchUser(switchTargetEmail, pin);

    if (result.success) {
        closeSwitchModal();
        checkAuthGate();
        window.dispatchEvent(new CustomEvent('userChanged'));
    } else {
        errorEl.textContent = result.message;
        errorEl.style.display = 'block';
    }
}

// ── Bootstrap on DOMContentLoaded ──────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    initAppData();
    renderAuthUI();
    checkAuthGate();
});
