// Default achievements template for new users
var DEFAULT_ACHIEVEMENTS = [
    {id:1,cat:'streak',icon:'🔥',iconBg:'rgba(245,158,11,0.2)',name:'First Step',desc:'Study for the first day.',xp:50,progress:0,total:1,unlocked:false,new:false},
    {id:2,cat:'streak',icon:'📅',iconBg:'rgba(245,158,11,0.2)',name:'Week Warrior',desc:'Maintain a 7-day study streak.',xp:200,progress:0,total:7,unlocked:false,new:false},
    {id:3,cat:'streak',icon:'🌟',iconBg:'rgba(245,158,11,0.2)',name:'10-Day Warrior',desc:'Maintain a 10-day study streak.',xp:350,progress:0,total:10,unlocked:false,new:false},
    {id:4,cat:'streak',icon:'💎',iconBg:'rgba(245,158,11,0.2)',name:'Month Master',desc:'30-day unbroken streak.',xp:1000,progress:0,total:30,unlocked:false,new:false},
    {id:5,cat:'time',icon:'⏱️',iconBg:'rgba(59,130,246,0.2)',name:'Getting Started',desc:'Complete your first study session.',xp:25,progress:0,total:1,unlocked:false,new:false},
    {id:6,cat:'time',icon:'⏰',iconBg:'rgba(59,130,246,0.2)',name:'Dedicated',desc:'Study for 10 total hours.',xp:100,progress:0,total:10,unlocked:false,new:false},
    {id:7,cat:'time',icon:'🕐',iconBg:'rgba(59,130,246,0.2)',name:'100hr Club',desc:'Reach 100 total study hours.',xp:500,progress:0,total:100,unlocked:false,new:false},
    {id:8,cat:'time',icon:'📚',iconBg:'rgba(59,130,246,0.2)',name:'Marathon Scholar',desc:'Study for 6 hours in a single day.',xp:300,progress:0,total:6,unlocked:false,new:false},
    {id:10,cat:'tasks',icon:'✅',iconBg:'rgba(16,185,129,0.2)',name:'Task Starter',desc:'Complete your first task.',xp:25,progress:0,total:1,unlocked:false,new:false},
    {id:11,cat:'tasks',icon:'📋',iconBg:'rgba(16,185,129,0.2)',name:'Productive',desc:'Complete 50 tasks.',xp:200,progress:0,total:50,unlocked:false,new:false},
    {id:14,cat:'focus',icon:'🧠',iconBg:'rgba(139,92,246,0.2)',name:'First Pomodoro',desc:'Complete your first Pomodoro session.',xp:25,progress:0,total:1,unlocked:false,new:false},
    {id:15,cat:'focus',icon:'🎯',iconBg:'rgba(139,92,246,0.2)',name:'Focused',desc:'Complete 10 Pomodoro sessions.',xp:100,progress:0,total:10,unlocked:false,new:false},
    {id:19,cat:'special',icon:'🌃',iconBg:'rgba(251,191,36,0.2)',name:'Night Scholar',desc:'Complete a session after 11 PM.',xp:150,progress:0,total:1,unlocked:false,new:false},
];

var achievements = [];
var currentCat = 'all';

function loadAchievementsFromUser() {
    var user = getCurrentUser();
    if (user) {
        if (!Array.isArray(user.achievements) || user.achievements.length === 0) {
            user.achievements = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS));
            saveData();
        }
        achievements = user.achievements;
    } else {
        achievements = [];
    }
    renderAchievements();
    updateAchievementsBanner();
}

function filterCat(cat,btn){
    currentCat=cat;
    document.querySelectorAll('.cat-tab').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    renderAchievements();
}

function renderAchievements(){
    var filtered = currentCat==='all' ? achievements : achievements.filter(function(a){return a.cat===currentCat;});
    var unlocked = filtered.filter(function(a){return a.unlocked;}).sort(function(a,b){return b.new-a.new;});
    var locked = filtered.filter(function(a){return !a.unlocked;});
    var all = unlocked.concat(locked);
    
    var grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    if (all.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-tertiary);padding:2rem;">No achievements yet. Start studying to unlock!</p>';
        return;
    }

    grid.innerHTML = all.map(function(a){
        var pct = Math.round((a.progress/a.total)*100);
        var barColor = a.unlocked ? 'var(--accent-gold)' : 'var(--accent-blue)';
        return '<div class="achievement-card '+(a.unlocked?'unlocked':'locked')+'">' +
            (a.new?'<div class="new-badge">NEW</div>':'') +
            '<div class="achievement-icon" style="background:'+a.iconBg+';">'+a.icon+'</div>' +
            '<div class="achievement-body">' +
                '<div class="achievement-name">'+a.name+'</div>' +
                '<div class="achievement-desc">'+a.desc+'</div>' +
                (!a.unlocked?
                '<div class="achievement-progress">' +
                    '<div class="ach-bar"><div class="ach-fill" style="width:'+pct+'%;background:'+barColor+';"></div></div>' +
                    '<span class="ach-label">'+a.progress+'/'+a.total+'</span>' +
                '</div>':'') +
                '<div class="achievement-xp">+'+a.xp+' XP</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// Dynamically update the XP banner and stats from user data
function updateAchievementsBanner() {
    var user = getCurrentUser();
    if (!user) return;
    var xp = user.xp || 0;
    var stats = user.stats || {completedTasks:0,totalFocusTime:0,streak:0};
    var achs = Array.isArray(user.achievements) ? user.achievements : [];
    var unlockedCount = achs.filter(function(a){return a.unlocked;}).length;
    var totalCount = achs.length || 1;
    var completionPct = Math.round((unlockedCount/totalCount)*100);

    // Level calculation: 1 level per 500 XP
    var level = Math.floor(xp / 500) + 1;
    var levelNames = ['Beginner','Learner','Student','Scholar','Expert','Master','Grandmaster'];
    var levelName = levelNames[Math.min(level-1, levelNames.length-1)];
    var xpForNext = level * 500;
    var xpPct = Math.min((xp / xpForNext) * 100, 100);

    // Update banner elements
    var nameEl = document.querySelector('.profile-name');
    var levelEl = document.querySelector('.profile-level');
    var xpFill = document.getElementById('xpFill');
    var xpText = document.querySelector('.xp-text');
    var headerUnlocked = document.getElementById('achievementsUnlockedHeader');

    if (nameEl) nameEl.textContent = user.username || 'Student';
    if (levelEl) levelEl.textContent = '⚡ Level ' + level + ' — ' + levelName;
    if (xpFill) xpFill.style.width = xpPct + '%';
    if (xpText) xpText.textContent = xp.toLocaleString() + ' / ' + xpForNext.toLocaleString() + ' XP';
    if (headerUnlocked) headerUnlocked.textContent = unlockedCount + ' / ' + totalCount + ' unlocked';

    // Update badges
    var badgesEl = document.querySelector('.profile-badges');
    if (badgesEl) {
        var badges = [];
        if (stats.streak >= 7) badges.push('🔥 '+stats.streak+'-Day Streak');
        var totalHours = Math.round((stats.totalFocusTime||0)/60);
        if (totalHours >= 100) badges.push('⏰ 100hr Club');
        if (stats.completedTasks >= 50) badges.push('✅ Task Master');
        if (badges.length === 0) badges.push('🎯 Keep going!');
        badgesEl.innerHTML = badges.map(function(b){return '<span class="mini-badge">'+b+'</span>';}).join('');
    }

    // Update stats row
    var statMinis = document.querySelectorAll('.stat-mini');
    if (statMinis.length >= 4) {
        statMinis[0].querySelector('.stat-mini-value').textContent = xp.toLocaleString();
        statMinis[1].querySelector('.stat-mini-value').textContent = String(unlockedCount);
        statMinis[2].querySelector('.stat-mini-value').textContent = String(stats.streak||0);
        statMinis[3].querySelector('.stat-mini-value').textContent = completionPct + '%';
    }
}

window.addEventListener('userChanged', loadAchievementsFromUser);
document.addEventListener('DOMContentLoaded', loadAchievementsFromUser);