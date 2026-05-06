// Analytics — fully user-scoped via appData

function getAnalyticsUser() {
    var user = getCurrentUser();
    if (!user) return null;
    if (!user.stats) user.stats = { completedTasks:0, totalFocusTime:0, streak:0 };
    if (!user.analytics) user.analytics = { dailyProgress:[], weeklyStats:[] };
    if (!Array.isArray(user.sessions)) user.sessions = [];
    return user;
}

function buildWeekData(user) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var result = [
        {day:'Mon',hours:0},{day:'Tue',hours:0},{day:'Wed',hours:0},
        {day:'Thu',hours:0},{day:'Fri',hours:0},{day:'Sat',hours:0},{day:'Sun',hours:0}
    ];
    // Build from sessions in the current week
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun
    var startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
    startOfWeek.setHours(0,0,0,0);

    var sessions = user.sessions || [];
    for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        var sDate = new Date(s.timestamp || s.date);
        if (sDate >= startOfWeek) {
            var sDay = sDate.getDay();
            var dayName = days[sDay];
            var idx = result.findIndex(function(r){ return r.day === dayName; });
            if (idx >= 0) {
                result[idx].hours += ((s.duration || 25) / 60);
            }
        }
    }
    // Round to 1 decimal
    result.forEach(function(r){ r.hours = Math.round(r.hours * 10) / 10; });
    return result;
}

function renderBarChart(data) {
    var el = document.getElementById('barChart');
    if (!el) return;
    var max = Math.max.apply(null, data.map(function(d){return d.hours;}).concat([1]));
    var todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
    el.innerHTML = data.map(function(d,i) {
        var pct = (d.hours/max)*100;
        var color = i === todayIdx ? 'var(--accent-blue)' : 'rgba(59,130,246,0.4)';
        return '<div class="bar-wrap">' +
            '<div class="bar-val">'+d.hours+'h</div>' +
            '<div class="bar-fill" style="height:'+Math.max(pct,4)+'%;background:'+color+';" data-val="'+d.hours+'h"></div>' +
            '<div class="bar-day">'+d.day+'</div>' +
        '</div>';
    }).join('');
}

function renderHeatmap() {
    var grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    var user = getAnalyticsUser();
    var sessions = (user && user.sessions) ? user.sessions : [];
    var cells = 84;
    // Build a map of date -> session count
    var dateMap = {};
    sessions.forEach(function(s){
        var d = s.date || new Date(s.timestamp).toISOString().slice(0,10);
        dateMap[d] = (dateMap[d]||0) + 1;
    });
    // Generate last 84 days
    var today = new Date();
    var cellsHtml = [];
    for (var i = cells-1; i >= 0; i--) {
        var dt = new Date(today);
        dt.setDate(today.getDate() - i);
        var key = dt.toISOString().slice(0,10);
        var count = dateMap[key] || 0;
        var intensity = Math.min(count, 5);
        cellsHtml.push('<div class="heat-cell heat-'+intensity+'" title="'+(count>0?count+' session'+(count>1?'s':''):'No study')+'"></div>');
    }
    grid.innerHTML = cellsHtml.join('');
}

function renderSummaryGrid(user) {
    var el = document.getElementById('summaryGrid');
    if (!el) return;
    var stats = user ? user.stats : {completedTasks:0,totalFocusTime:0,streak:0};
    var sessions = (user && Array.isArray(user.sessions)) ? user.sessions : [];
    var totalHours = Math.round((stats.totalFocusTime||0)/60*10)/10;
    el.innerHTML =
        '<div class="summary-card"><div class="summary-icon" style="background:rgba(59,130,246,0.15);color:var(--accent-blue);"><i class="fas fa-clock"></i></div><div class="summary-info"><div class="summary-val">'+totalHours+'h</div><div class="summary-label">Total Study</div></div></div>' +
        '<div class="summary-card"><div class="summary-icon" style="background:rgba(16,185,129,0.15);color:var(--accent-green);"><i class="fas fa-check-circle"></i></div><div class="summary-info"><div class="summary-val">'+(stats.completedTasks||0)+'</div><div class="summary-label">Tasks Done</div></div></div>' +
        '<div class="summary-card"><div class="summary-icon" style="background:rgba(245,158,11,0.15);color:var(--accent-orange);"><i class="fas fa-fire"></i></div><div class="summary-info"><div class="summary-val">'+(stats.streak||0)+'</div><div class="summary-label">Day Streak</div></div></div>' +
        '<div class="summary-card"><div class="summary-icon" style="background:rgba(139,92,246,0.15);color:var(--accent-purple);"><i class="fas fa-brain"></i></div><div class="summary-info"><div class="summary-val">'+sessions.length+'</div><div class="summary-label">Sessions</div></div></div>';
}

function updateStreakDisplay(user) {
    var stats = user ? user.stats : {streak:0};
    var streak = stats.streak || 0;
    var streakNum = document.getElementById('streakNumber');
    var streakMsg = document.getElementById('streakMessage');
    if (streakNum) streakNum.textContent = String(streak);
    if (streakMsg) {
        if (streak === 0) streakMsg.textContent = 'Start studying to build your streak!';
        else if (streak < 7) streakMsg.textContent = 'Keep going! ' + (7-streak) + ' more days to unlock "Week Warrior"';
        else if (streak < 10) streakMsg.textContent = 'Keep going! ' + (10-streak) + ' more days to unlock "10 Day Warrior"';
        else if (streak < 30) streakMsg.textContent = 'Amazing! ' + (30-streak) + ' more days to unlock "Month Master"';
        else streakMsg.textContent = 'Incredible ' + streak + '-day streak! You\'re unstoppable!';
    }
}

function updateLegend(user) {
    var weekData = buildWeekData(user || {sessions:[]});
    var thisWeekTotal = weekData.reduce(function(s,d){return s+d.hours;},0);
    thisWeekTotal = Math.round(thisWeekTotal*10)/10;
    var avg = Math.round((thisWeekTotal/7)*10)/10;
    var sessions = (user && Array.isArray(user.sessions)) ? user.sessions : [];
    var stats = user ? user.stats : {completedTasks:0,totalFocusTime:0,streak:0};
    var totalHours = Math.round((stats.totalFocusTime||0)/60*10)/10;

    // Chart legend
    var legendVals = document.querySelectorAll('#chartLegend .legend-value');
    if (legendVals.length >= 3) {
        legendVals[0].textContent = thisWeekTotal+'h';
        legendVals[1].textContent = String(sessions.length);
        legendVals[2].textContent = avg+'h';
    }

    // Donut center + legend
    var donutTotal = document.getElementById('donutTotal');
    var donutFocus = document.getElementById('donutFocus');
    var donutTasks = document.getElementById('donutTasks');
    var donutStreak = document.getElementById('donutStreak');
    var donutSessions = document.getElementById('donutSessions');
    if (donutTotal) donutTotal.textContent = totalHours+'h';
    if (donutFocus) donutFocus.textContent = totalHours+'h';
    if (donutTasks) donutTasks.textContent = String(stats.completedTasks||0);
    if (donutStreak) donutStreak.textContent = (stats.streak||0)+' days';
    if (donutSessions) donutSessions.textContent = String(sessions.length);
}

function loadAnalytics() {
    var user = getAnalyticsUser();
    var weekData = buildWeekData(user || {sessions:[]});
    renderBarChart(weekData);
    renderHeatmap();
    renderSummaryGrid(user);
    updateStreakDisplay(user);
    updateLegend(user);
}

function setPeriod(p, btn) {
    document.querySelectorAll('.period-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    loadAnalytics();
}

// Init
document.addEventListener('DOMContentLoaded', loadAnalytics);
window.addEventListener('userChanged', loadAnalytics);