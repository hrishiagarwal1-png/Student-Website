# ⏳ POMODORO PAGE PRD (pomodoro.html)

Follow the MASTER PRD strictly for layout, styling, sidebar, and header.

Do NOT create new design systems. Use existing classes from homepage.html.

---

## 🎯 OBJECTIVE

This page is for **executing and tracking study sessions**, not planning them.

It should:

* Run Pomodoro timers
* Show today’s sessions
* Show weekly session overview
* Track progress live

---

## ⏱️ MAIN TIMER (CORE FEATURE)

### Modes:

User can select between:

* Short Session → 25 minutes
* Focus Time → 45 minutes
* Deep Work → 60 minutes

---

### Timer Controls:

* Start
* Pause
* Reset

---

### Display:

* Time remaining (MM:SS)
* Current mode (Short / Focus / Deep Work)

---

## 🎯 ACTIVE SESSION

Display currently active session:

Example:

* "Physics – Session 2"

Behavior:

* Updates when user selects a session
* Links with today's session list

---

## 📋 TODAY’S SESSIONS

### Purpose:

Show sessions scheduled for today (read-only from tasks data)

---

### Display:

List format:

* Physics → 2 sessions
* Math → 1 session

---

### Behavior:

* Clicking a task sets it as active session
* Progress updates when sessions are completed

---

## 📅 WEEKLY SESSIONS OVERVIEW

### Purpose:

Show total sessions planned for the week

---

### Display:

Simple list or grouped format:

* Monday → 3 sessions
* Tuesday → 2 sessions
* Wednesday → 4 sessions

---

### Rules:

* Do NOT allow editing here
* Read-only display

---

## 🔁 LIVE SESSION PROGRESS

### Purpose:

Track progress for each task

---

### Display:

Visual progress per task:

Example:

* Physics → ● ● ○ (2/3 complete)
* Math → ● ○ (1/2 complete)

---

### Behavior:

* Updates automatically when timer completes
* Progress persists using localStorage

---

## ⚙️ SESSION COMPLETION LOGIC

When a timer finishes:

* Increase completed session count for active task
* Update today’s session progress
* Update weekly data if needed

---

## 📊 STATS (MINIMAL)

Display:

* Sessions completed today
* Total focus time today

---

## 💾 DATA STRUCTURE (LOCALSTORAGE)

```json
[
  {
    "task": "Physics",
    "sessionsPlanned": 3,
    "sessionsCompleted": 1,
    "date": "2026-04-22"
  }
]
```

---

## 🧩 LAYOUT STRUCTURE

Inside `.content`:

```html
<div class="timer-section"></div>

<div class="active-session"></div>

<div class="session-progress"></div>

<div class="today-sessions"></div>

<div class="weekly-sessions"></div>

<div class="stats"></div>
```

---

## ⚠️ RULES

* Do NOT add scheduling features
* Do NOT allow editing sessions here
* Do NOT clutter UI
* Keep timer as main focus

---

## ✅ EXPECTED RESULT

* Clean, focused Pomodoro page
* Fully connected with tasks data
* Real-time session tracking
* Matches homepage design exactly

---
Task:
Update the existing pomodoro-prd.md to include localStorage integration for session tracking.

Strict Rules:
- Do NOT change existing structure or features
- Do NOT remove any existing sections
- ONLY ADD new sections related to localStorage
- Keep everything consistent with current PRD
- Pomodoro page must NOT create or edit tasks, only read and update

Add the following functionality:

1. Data Source
- Pomodoro page must read tasks from localStorage
- Use key: "tasks"
- Data format:
[
  {
    "id": number,
    "task": string,
    "sessionsPlanned": number,
    "sessionsCompleted": number,
    "date": string
  }
]

2. On Page Load
- Load tasks from localStorage
- Filter tasks for today’s date
- Display them in "Today’s Sessions"

3. Session Completion Logic
When a Pomodoro timer finishes:
- Identify active task
- Increment its "sessionsCompleted" by 1
- Update localStorage with new data

4. Live Sync
- UI must update immediately after session completion
- Progress indicators must reflect updated values

5. Safety Rules
- Do NOT modify sessionsPlanned
- Do NOT create new tasks
- Do NOT delete tasks
- Only update sessionsCompleted

6. Fallback Handling
- If no data in localStorage:
  - Show empty state (e.g., "No sessions planned for today")
- Do NOT crash

7. Persistence
- All updates must be saved back to localStorage instantly

Output:
- Show ONLY the new sections added to the PRD
- Clearly label them (e.g., "## LocalStorage Integration")