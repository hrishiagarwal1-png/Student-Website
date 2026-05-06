        // Timer variables
        let timerMinutes = 25;
        let timerSeconds = 0;
        let timerInterval = null;
        let isTimerRunning = false;
        let totalSessionSeconds = 25 * 60;
        const startTickSound = new Audio('tick.mp3');

        // Initialize the dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
            updateClock();
            setInterval(updateClock, 1000);
            loadFromStorage();
            hydratePomodoroFromTaskStorage();
            bindPomodoroTaskSelection();

            window.addEventListener('userChanged', function () {
                loadFromStorage();
                hydratePomodoroFromTaskStorage();
            });
        });

        function initializeDashboard() {
            updateTimerDisplay();
            updateProgressBars();
            setupEventListeners();
            initializeSidebar();
        }

        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const el = document.getElementById('currentTime');
            if (el) el.textContent = timeString;
        }

        function updateTimerDisplay() {
            const display = `${timerMinutes.toString().padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}`;
            const el = document.getElementById('quickTimerDisplay');
            if (el) el.textContent = display;
        }

        function updateProgressBars() {
            var user = getCurrentUser();
            if (!user) return;
            var tasks = Array.isArray(user.tasks) ? user.tasks : [];
            var totalPlanned = tasks.reduce(function(s,t){ return s + (Number(t.sessionsPlanned)||0); }, 0);
            var totalCompleted = tasks.reduce(function(s,t){ return s + (Number(t.sessionsCompleted)||0); }, 0);
            var completedTasks = tasks.filter(function(t){ return t.completed; }).length;
            var taskTotal = tasks.length || 1;

            var dailyPct = totalPlanned > 0 ? Math.min((totalCompleted/totalPlanned)*100,100) : 0;
            var pomodoroPct = dailyPct;
            var taskPct = Math.min((completedTasks/taskTotal)*100,100);

            var blue = document.querySelector('.progress-fill.accent-blue');
            var green = document.querySelector('.progress-fill.accent-green');
            var orange = document.querySelector('.progress-fill.accent-orange');
            if (blue) blue.style.width = dailyPct+'%';
            if (green) green.style.width = pomodoroPct+'%';
            if (orange) orange.style.width = taskPct+'%';

            // Update homepage stat cards
            var totalFocusEl = document.getElementById('totalStudyTime');
            var completedTasksEl = document.getElementById('completedTasks');
            var streakEl = document.getElementById('studyStreak');
            var achieveEl = document.getElementById('achievementCount');
            var stats = user.stats || {};
            var achs = Array.isArray(user.achievements) ? user.achievements : [];
            var unlockedCount = achs.filter(function(a){ return a.unlocked; }).length;

            if (totalFocusEl) totalFocusEl.textContent = (stats.totalFocusTime||0) + 'm';
            if (completedTasksEl) completedTasksEl.textContent = String(stats.completedTasks||0);
            if (streakEl) streakEl.textContent = String(stats.streak||0);
            if (achieveEl) achieveEl.textContent = String(unlockedCount);

            // Header stats
            var streakCounter = document.getElementById('streakCounter');
            var todayTime = document.getElementById('todayTime');
            if (streakCounter) streakCounter.textContent = String(stats.streak||0);
            if (todayTime) todayTime.textContent = (stats.totalFocusTime||0)+'m';

            // Progress labels
            var dp = document.getElementById('dailyProgress');
            var pp = document.getElementById('pomodoroProgress');
            var tp = document.getElementById('taskProgress');
            if (dp) dp.textContent = totalCompleted+'/'+totalPlanned+' complete';
            if (pp) pp.textContent = totalCompleted+'/'+totalPlanned+' complete';
            if (tp) tp.textContent = completedTasks+'/'+taskTotal+' tasks';
        }

        function setupEventListeners() {
            var startBtn = document.getElementById('quickStartBtn');
            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    if (!isTimerRunning) triggerTimerStartFeedback();
                    toggleTimer();
                });
            }
            var resetBtn = document.getElementById('quickResetBtn');
            if (resetBtn) resetBtn.addEventListener('click', resetTimer);

            var addBtn = document.getElementById('quickAddBtn');
            if (addBtn) addBtn.addEventListener('click', addQuickTask);
            var quickInput = document.getElementById('quickTaskInput');
            if (quickInput) {
                quickInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') addQuickTask();
                });
            }

            var toggle = document.getElementById('sidebarToggle');
            if (toggle) toggle.addEventListener('click', toggleSidebar);

            document.querySelectorAll('.task-checkbox').forEach(function(cb) {
                cb.addEventListener('click', function() {
                    var item = this.closest('.task-item');
                    if (item) item.classList.toggle('completed');
                    updateProgressBars();
                });
            });

            document.addEventListener('keydown', function(e) {
                if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    toggleTimer();
                }
            });
        }

        function initializeSidebar() {
            document.querySelectorAll('.nav-link').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    var href = this.getAttribute('href');
                    if (!href || href === '#' || href.startsWith('#')) e.preventDefault();
                    document.querySelectorAll('.nav-item').forEach(function(i){ i.classList.remove('active'); });
                    this.parentElement.classList.add('active');
                });
            });
        }

        // Timer functions
        function toggleTimer() {
            if (isTimerRunning) pauseTimer(); else startTimer();
        }

        function startTimer() {
            isTimerRunning = true;
            var btn = document.getElementById('quickStartBtn');
            if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            timerInterval = setInterval(function() {
                if (timerSeconds === 0) {
                    if (timerMinutes === 0) { completeSession(); return; }
                    timerMinutes--;
                    timerSeconds = 59;
                } else {
                    timerSeconds--;
                }
                updateTimerDisplay();
            }, 1000);
        }

        function triggerTimerStartFeedback() {
            var el = document.getElementById('quickTimerDisplay');
            if (!el) return;
            startTickSound.currentTime = 0;
            startTickSound.play();
            el.classList.remove('timer-start');
            void el.offsetWidth;
            el.classList.add('timer-start');
            setTimeout(function(){ el.classList.remove('timer-start'); }, 600);
        }

        function pauseTimer() {
            isTimerRunning = false;
            clearInterval(timerInterval);
            var btn = document.getElementById('quickStartBtn');
            if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Start';
        }

        function resetTimer() {
            pauseTimer();
            timerMinutes = 25;
            timerSeconds = 0;
            totalSessionSeconds = 25 * 60;
            updateTimerDisplay();
        }

        function completeSession() {
            pauseTimer();
            // Update user stats
            var user = getCurrentUser();
            if (user) {
                if (!user.stats) user.stats = {completedTasks:0,totalFocusTime:0,streak:0};
                user.stats.totalFocusTime = (user.stats.totalFocusTime||0) + 25;
                if (!Array.isArray(user.sessions)) user.sessions = [];
                user.sessions.push({ date: getTodayDateString(), duration: 25, timestamp: Date.now() });
                saveData();
            }
            incrementActiveTaskSessionCompletion();
            showNotification('Session completed! Great work!', 'success');
            updateProgressBars();
            // Reset for break
            timerMinutes = 5;
            timerSeconds = 0;
            totalSessionSeconds = 5 * 60;
            var modeEl = document.getElementById('timerMode');
            if (modeEl) modeEl.textContent = 'Break Time';
            updateTimerDisplay();
            hydratePomodoroFromTaskStorage();
        }

        function setQuickTimer(minutes) {
            pauseTimer();
            timerMinutes = minutes;
            timerSeconds = 0;
            totalSessionSeconds = minutes * 60;
            updateTimerDisplay();
            var modeText = minutes === 15 ? 'Short Break' : minutes === 25 ? 'Focus Session' : 'Deep Work';
            var el = document.getElementById('timerMode');
            if (el) el.textContent = modeText;
        }

        // Quick task (Homepage only)
        function addQuickTask() {
            var input = document.getElementById('quickTaskInput');
            if (!input) return;
            var text = input.value.trim();
            if (!text) return;
            var user = getCurrentUser();
            if (!user) return;
            if (!Array.isArray(user.tasks)) user.tasks = [];
            user.tasks.push({ id: Date.now(), title: text, due: 'Today', priority: 'Medium', completed: false });
            saveData();
            renderTasks();
            input.value = '';
            showNotification('Task added successfully!', 'success');
        }

        function renderTasks() {
            var list = document.getElementById('recentTasks');
            if (!list || isPomodoroPage()) return;
            var user = getCurrentUser();
            var tasks = (user && Array.isArray(user.tasks)) ? user.tasks : [];
            var recent = tasks.slice(-3);
            if (recent.length === 0) {
                list.innerHTML = '<div class="task-item"><div class="task-content"><span class="task-title">No tasks yet</span><span class="task-meta">Add your first task above</span></div></div>';
                return;
            }
            list.innerHTML = recent.map(function(t) {
                return '<div class="task-item '+(t.completed?'completed':'')+'">' +
                    '<div class="task-checkbox" onclick="toggleTaskHome('+t.id+')">' +
                        (t.completed ? '<i class="fas fa-check"></i>' : '') +
                    '</div>' +
                    '<div class="task-content">' +
                        '<span class="task-title">'+(t.title||t.task)+'</span>' +
                        '<span class="task-meta">Due: '+(t.due||'Today')+' • '+(t.priority||'Medium')+' Priority</span>' +
                    '</div></div>';
            }).join('');
        }

        function toggleTaskHome(taskId) {
            var user = getCurrentUser();
            if (!user || !Array.isArray(user.tasks)) return;
            var task = user.tasks.find(function(t){ return t.id === taskId; });
            if (task) {
                task.completed = !task.completed;
                saveData();
                renderTasks();
                updateProgressBars();
            }
        }

        function toggleSidebar() {
            var sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('open');
        }

        // Notification system
        function showNotification(message, type) {
            type = type || 'info';
            var el = document.createElement('div');
            el.className = 'notification ' + type;
            el.style.cssText = 'position:fixed;top:20px;right:20px;padding:1rem 1.5rem;background:var(--accent-'+(type==='success'?'green':type==='error'?'red':'blue')+');color:white;border-radius:8px;z-index:1000;animation:slideIn 0.3s ease;';
            el.textContent = message;
            document.body.appendChild(el);
            setTimeout(function() {
                el.style.animation = 'slideOut 0.3s ease';
                setTimeout(function(){ el.remove(); }, 300);
            }, 3000);
        }

        // Data persistence (per-user via appData)
        function saveToStorage() {
            saveData();
        }

        function loadFromStorage() {
            var user = getCurrentUser();
            if (!user) return;
            // Sync completedTasks stat from actual tasks
            if (!user.stats) user.stats = {completedTasks:0,totalFocusTime:0,streak:0};
            var tasks = Array.isArray(user.tasks) ? user.tasks : [];
            user.stats.completedTasks = tasks.filter(function(t){ return t.completed; }).length;
            saveData();
            renderTasks();
            updateProgressBars();
            renderHomepageWeeklyChart(user);
            renderHomepageAchievements(user);
        }

        // Homepage weekly chart (from user.sessions)
        function renderHomepageWeeklyChart(user) {
            var el = document.getElementById('homepageWeeklyChart');
            if (!el) return;
            var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            var dayOrder = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            var result = {};
            dayOrder.forEach(function(d){ result[d] = 0; });
            var now = new Date();
            var dayOfWeek = now.getDay();
            var startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
            startOfWeek.setHours(0,0,0,0);
            var sessions = Array.isArray(user.sessions) ? user.sessions : [];
            sessions.forEach(function(s){
                var sDate = new Date(s.timestamp || s.date);
                if (sDate >= startOfWeek) {
                    var dn = days[sDate.getDay()];
                    result[dn] = (result[dn]||0) + ((s.duration||25)/60);
                }
            });
            var values = dayOrder.map(function(d){ return Math.round((result[d]||0)*10)/10; });
            var max = Math.max.apply(null, values.concat([1]));
            var todayIdx = (now.getDay()+6)%7;
            el.innerHTML = dayOrder.map(function(d,i){
                var v = values[i];
                var pct = (v/max)*100;
                return '<div class="bar'+(i===todayIdx?' active':'')+'" style="--bar-height:'+Math.max(pct,2)+'%"><div class="bar-value">'+v+'h</div><div class="bar-label">'+d+'</div></div>';
            }).join('');
            // Update summary
            var total = values.reduce(function(s,v){return s+v;},0);
            total = Math.round(total*10)/10;
            var avg = Math.round((total/7)*10)/10;
            var bestIdx = 0; values.forEach(function(v,i){ if(v>values[bestIdx]) bestIdx=i; });
            var avgEl = document.getElementById('homeAvgDaily');
            var bestEl = document.getElementById('homeBestDay');
            if (avgEl) avgEl.textContent = avg+'h';
            if (bestEl) bestEl.textContent = values[bestIdx]>0 ? dayOrder[bestIdx] : '—';
        }

        // Homepage recent achievements
        function renderHomepageAchievements(user) {
            var el = document.getElementById('homeRecentAchievements');
            if (!el) return;
            var achs = Array.isArray(user.achievements) ? user.achievements : [];
            var unlocked = achs.filter(function(a){ return a.unlocked; });
            if (unlocked.length === 0) {
                el.innerHTML = '<div class="achievement-item"><div class="achievement-icon accent-gold"><i class="fas fa-trophy"></i></div><div class="achievement-info"><h4>No achievements yet</h4><p>Start studying to unlock achievements</p></div></div>';
                return;
            }
            var recent = unlocked.slice(-2).reverse();
            el.innerHTML = recent.map(function(a){
                return '<div class="achievement-item'+(a.new?' new':'')+'"><div class="achievement-icon accent-gold"><i class="fas fa-star"></i></div><div class="achievement-info"><h4>'+a.name+'</h4><p>'+a.desc+'</p><span class="achievement-date">+'+a.xp+' XP</span></div></div>';
            }).join('');
        }

        function isPomodoroPage() {
            return !!document.querySelector('.today-sessions');
        }

        function getTasksFromStorage() {
            var user = getCurrentUser();
            if (!user) return [];
            return Array.isArray(user.tasks) ? user.tasks : [];
        }

        function saveTasksToStorage(tasks) {
            var user = getCurrentUser();
            if (!user) return;
            user.tasks = tasks;
            saveData();
        }

        function getTodayDateString() {
            var now = new Date();
            return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
        }

        function getTodayTasks(tasks) {
            var today = getTodayDateString();
            return tasks.filter(function(t){ return t && t.date === today; });
        }

        function getActiveTaskId() {
            var user = getCurrentUser();
            if (!user) return null;
            return user.activeTaskId || null;
        }

        function setActiveTaskId(taskId) {
            var user = getCurrentUser();
            if (!user) return;
            user.activeTaskId = taskId;
            saveData();
        }

        function hydratePomodoroFromTaskStorage() {
            if (!isPomodoroPage()) return;
            var tasks = getTasksFromStorage();
            var todayTasks = getTodayTasks(tasks);
            renderTodaySessionsFromStorage(todayTasks);
            renderLiveProgressFromStorage(todayTasks);
            updateActiveSessionCardFromStorage(todayTasks);
        }

        function renderTodaySessionsFromStorage(todayTasks) {
            var taskList = document.getElementById('recentTasks');
            if (!taskList) return;
            if (todayTasks.length === 0) {
                taskList.innerHTML = '<div class="task-item"><div class="task-content"><span class="task-title">No sessions planned for today</span><span class="task-meta">Add tasks from Task Manager</span></div></div>';
                return;
            }
            var activeTaskId = getActiveTaskId();
            taskList.innerHTML = todayTasks.map(function(task) {
                var isActive = task.id === activeTaskId;
                return '<div class="task-item '+(isActive?'completed':'')+'" data-task-id="'+task.id+'">' +
                    '<div class="task-checkbox">'+(isActive?'<i class="fas fa-check"></i>':'')+'</div>' +
                    '<div class="task-content">' +
                        '<span class="task-title">'+task.task+'</span>' +
                        '<span class="task-meta">'+task.sessionsCompleted+'/'+task.sessionsPlanned+' sessions complete</span>' +
                    '</div></div>';
            }).join('');
        }

        function renderLiveProgressFromStorage(todayTasks) {
            var totalPlanned = todayTasks.reduce(function(s,t){ return s+(Number(t.sessionsPlanned)||0); },0);
            var totalCompleted = todayTasks.reduce(function(s,t){ return s+(Number(t.sessionsCompleted)||0); },0);

            var dp = document.getElementById('dailyProgress');
            var pp = document.getElementById('pomodoroProgress');
            var tp = document.getElementById('taskProgress');
            var ct = document.getElementById('completedTasks');
            var st = document.getElementById('totalStudyTime');

            if (dp) dp.textContent = totalCompleted+'/'+totalPlanned+' complete';
            if (pp) pp.textContent = totalCompleted+'/'+totalPlanned+' complete';
            if (tp) tp.textContent = totalCompleted+'/'+totalPlanned+' complete';
            if (ct) ct.textContent = String(totalCompleted);
            if (st) st.textContent = (totalCompleted*25)+'m';

            var pct = totalPlanned > 0 ? Math.min((totalCompleted/totalPlanned)*100,100) : 0;
            var blue = document.querySelector('.progress-fill.accent-blue');
            var green = document.querySelector('.progress-fill.accent-green');
            var orange = document.querySelector('.progress-fill.accent-orange');
            if (blue) blue.style.width = pct+'%';
            if (green) green.style.width = pct+'%';
            if (orange) orange.style.width = pct+'%';
        }

        function updateActiveSessionCardFromStorage(todayTasks) {
            var activeTaskId = getActiveTaskId();
            var activeTask = todayTasks.find(function(t){ return t.id === activeTaskId; }) || todayTasks[0];
            var el = document.querySelector('.active-session .task-title');
            if (!el) return;
            if (!activeTask) { el.textContent = 'No active session selected'; return; }
            if (!activeTaskId) setActiveTaskId(activeTask.id);
            el.textContent = activeTask.task + ' - Session ' + Math.min((activeTask.sessionsCompleted||0)+1, activeTask.sessionsPlanned||1);
        }

        function bindPomodoroTaskSelection() {
            if (!isPomodoroPage()) return;
            var taskList = document.getElementById('recentTasks');
            if (!taskList) return;
            taskList.addEventListener('click', function(event) {
                var item = event.target.closest('.task-item[data-task-id]');
                if (!item) return;
                var id = Number(item.dataset.taskId);
                if (!Number.isFinite(id)) return;
                setActiveTaskId(id);
                hydratePomodoroFromTaskStorage();
            });
        }

        function incrementActiveTaskSessionCompletion() {
            if (!isPomodoroPage()) return;
            var tasks = getTasksFromStorage();
            if (tasks.length === 0) return;
            var activeTaskId = getActiveTaskId();
            var idx = tasks.findIndex(function(t){ return t && t.id === activeTaskId; });
            if (idx < 0) return;
            var t = tasks[idx];
            var cur = Number(t.sessionsCompleted) || 0;
            var plan = Number(t.sessionsPlanned) || 0;
            tasks[idx] = Object.assign({}, t, { sessionsCompleted: plan > 0 ? Math.min(cur+1,plan) : cur+1 });
            saveTasksToStorage(tasks);
        }

        // ===== Clock Toggle & Analog Sync =====
        function initClockToggle() {
            var dv = document.getElementById('digitalClockView');
            var av = document.getElementById('analogClockView');
            var tg = document.getElementById('clockToggle');
            if (!dv || !av || !tg) return;
            var saved = localStorage.getItem('pomodoroClockType');
            if (saved === 'analog') {
                dv.classList.remove('active');
                av.classList.add('active');
                var r = tg.querySelector('input[value="analog"]');
                if (r) r.checked = true;
            }
            tg.addEventListener('change', function(e) {
                var type = e.target.value;
                if (type === 'analog') { dv.classList.remove('active'); av.classList.add('active'); }
                else { av.classList.remove('active'); dv.classList.add('active'); }
                localStorage.setItem('pomodoroClockType', type);
                syncAnalogClock();
            });
            syncAnalogClock();
        }

        function syncAnalogClock() {
            var mh = document.getElementById('clockHandMinute');
            var sh = document.getElementById('clockHandSecond');
            if (!mh || !sh) return;
            var rem = timerMinutes*60+timerSeconds;
            var elapsed = totalSessionSeconds - rem;
            var secDeg = (elapsed/60)*360;
            var minDeg = totalSessionSeconds > 0 ? (elapsed/totalSessionSeconds)*360 : 0;
            sh.style.transform = 'translateX(-50%) rotate('+secDeg+'deg)';
            mh.style.transform = 'translateX(-50%) rotate('+minDeg+'deg)';
        }

        var _origUpdate = updateTimerDisplay;
        updateTimerDisplay = function() { _origUpdate(); syncAnalogClock(); };

        // ===== Intro Clock Animation =====
        let introAnimationRunning = false;
        function playIntroClockAnimation(callback) {
            var ov = document.getElementById('introClockOverlay');
            if (!ov) { callback(); return; }
            var mh = ov.querySelector('.spin-hand-minute');
            var sh = ov.querySelector('.spin-hand-second');
            mh.classList.remove('spinning');
            sh.classList.remove('spinning');
            void ov.offsetWidth;
            ov.classList.remove('fade-out');
            ov.classList.add('active');
            requestAnimationFrame(function(){ mh.classList.add('spinning'); sh.classList.add('spinning'); });
            setTimeout(function(){
                ov.classList.add('fade-out');
                setTimeout(function(){
                    ov.classList.remove('active','fade-out');
                    mh.classList.remove('spinning');
                    sh.classList.remove('spinning');
                    if (callback) callback();
                }, 400);
            }, 2500);
        }

        var _origStart = startTimer;
        startTimer = function() {
            if (introAnimationRunning) return;
            introAnimationRunning = true;
            playIntroClockAnimation(function(){ introAnimationRunning = false; _origStart(); });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initClockToggle);
        } else {
            initClockToggle();
        }

        // Add CSS animations
        var style = document.createElement('style');
        style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}';
        document.head.appendChild(style);