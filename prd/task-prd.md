Task:
Build the tasks.html page for a student productivity web app using ONLY existing HTML, CSS, and JavaScript.

IMPORTANT RULES:
- Do NOT change global layout, sidebar, or header styles
- Must match existing website design (same classes and theme)
- Do NOT introduce new frameworks or libraries
- Keep all logic inside vanilla JS
- Ensure sections are clearly separated and spaced vertically (page must scroll naturally)

PAGE STRUCTURE:

1. TODO LIST SECTION (Top Priority)
- User can add tasks using an input field + "Add Task" button
- Each task appears in a list below
- Each task should have:
  - task name
  - checkbox (mark complete)
  - delete button
- When user clicks "Add Task":
  - Prompt user: "Schedule a Pomodoro session for this task? (Yes/No)"
  - If YES:
    - Ask number of sessions (simple prompt input)
    - Store session count with task

DATA RULE:
- Store tasks in localStorage

---

2. POMODORO TASK LINKING
- Each task can have:
  - total sessions planned
  - sessions completed
- Display progress like:
  "3/5 sessions completed"

---

3. WEEKLY BAR GRAPH SECTION
- Show bar graph with:
  - X-axis: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  - Y-axis: number of completed tasks
- Use ONLY HTML/CSS/JS (no libraries)
- Bars should visually scale based on task completion count stored in localStorage

---

4. ACHIEVEMENT PROGRESS SECTION
- Show current achievement goal:
  Example:
  "Complete 10 tasks to unlock: Focus Master"
- Show:
  - tasks completed so far
  - remaining tasks to next achievement
- Progress bar should visually fill based on completion

---

5. PAGE LAYOUT REQUIREMENT (VERY IMPORTANT)
- Each section must be in its own large container div:
  - todo-container
  - graph-container
  - achievement-container
- Add spacing so page feels tall and scrollable
- Each section should feel like a dashboard card

---

6. STYLING REQUIREMENTS:
- Match existing website theme exactly
- Use:
  - dark/light contrast same as homepage
  - consistent buttons and fonts
- Keep UI clean and spaced
- No clutter

---

7. FUNCTIONALITY FLOW:
- Add task → task appears in list
- Optional scheduling prompt → attaches Pomodoro sessions
- Completing tasks → updates:
  - localStorage
  - bar graph
  - achievement progress

---

OUTPUT:
- Provide full tasks.html
- Provide only necessary additions to style.css and script.js
- Do NOT rewrite unrelated parts of existing project