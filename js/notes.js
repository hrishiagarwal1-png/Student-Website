const tagColors = {study:'rgba(59,130,246,0.2)',code:'rgba(16,185,129,0.2)',idea:'rgba(245,158,11,0.2)',important:'rgba(251,191,36,0.2)'};
const tagTextColors = {study:'var(--accent-blue)',code:'var(--accent-green)',idea:'var(--accent-orange)',important:'var(--accent-gold)'};

let notes = [];
let currentNoteId = null;
let autoSaveTimeout = null;

function loadNotesFromUser() {
    var user = getCurrentUser();
    if (user) {
        notes = Array.isArray(user.notes) ? user.notes : [];
    } else {
        notes = [];
    }
    currentNoteId = null;
    var editor = document.getElementById('noteEditor');
    var empty = document.getElementById('emptyEditor');
    if (editor) editor.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    renderNotesList();
}

function saveNotesData() {
    var user = getCurrentUser();
    if (!user) return;
    user.notes = notes;
    saveData();
}

window.addEventListener('userChanged', loadNotesFromUser);
document.addEventListener('DOMContentLoaded', loadNotesFromUser);

function renderNotesList(filter=''){
    const list = document.getElementById('notesList');
    const filtered = notes.filter(n=>n.title.toLowerCase().includes(filter)||n.body.toLowerCase().includes(filter));
    
    if(filtered.length===0){
        list.innerHTML=`<div style="text-align:center;padding:2rem;color:var(--text-tertiary);font-size:0.875rem;"><i class="fas fa-search" style="display:block;margin-bottom:0.5rem;"></i>No notes found</div>`;
        return;
    }
    
    list.innerHTML = filtered.sort((a,b)=>b.updated-a.updated).map(n=>{
        const tagHtml = n.tag ? `<span class="note-tag" style="background:${tagColors[n.tag]};color:${tagTextColors[n.tag]};">${n.tag}</span>` : '';
        const date = new Date(n.updated).toLocaleDateString('en-US',{month:'short',day:'numeric'});
        const preview = n.body.replace(/\n/g,' ').substring(0,60)+'...';
        return `<div class="note-item ${n.id===currentNoteId?'active':''}" onclick="openNote(${n.id})">
            <button class="note-item-delete" onclick="event.stopPropagation();deleteNote(${n.id})"><i class="fas fa-times"></i></button>
            <div class="note-item-title">${n.title||'Untitled'}</div>
            <div class="note-item-preview">${preview}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;">
                ${tagHtml}
                <span class="note-item-date">${date}</span>
            </div>
        </div>`;
    }).join('');
}

function openNote(id){
    currentNoteId = id;
    const note = notes.find(n=>n.id===id);
    if(!note) return;
    
    document.getElementById('emptyEditor').style.display='none';
    document.getElementById('noteEditor').style.display='flex';
    document.getElementById('noteTitleInput').value = note.title;
    document.getElementById('noteBodyInput').value = note.body;
    document.getElementById('tagSelect').value = note.tag||'';
    updateWordCount();
    document.getElementById('lastSaved').textContent = 'Saved '+new Date(note.updated).toLocaleTimeString();
    renderNotesList();
}

function newNote(){
    const note = {id:Date.now(),title:'',body:'',tag:'',created:Date.now(),updated:Date.now()};
    notes.unshift(note);
    saveNotesData();
    renderNotesList();
    openNote(note.id);
    document.getElementById('noteTitleInput').focus();
}

function saveNote(){
    if(!currentNoteId) return;
    const note = notes.find(n=>n.id===currentNoteId);
    if(!note) return;
    note.title = document.getElementById('noteTitleInput').value||'Untitled';
    note.body = document.getElementById('noteBodyInput').value;
    note.tag = document.getElementById('tagSelect').value;
    note.updated = Date.now();
    saveNotesData();
    renderNotesList();
    document.getElementById('lastSaved').textContent = 'Saved just now';
}

function autoSave(){
    clearTimeout(autoSaveTimeout);
    updateWordCount();
    document.getElementById('lastSaved').textContent = 'Saving...';
    autoSaveTimeout = setTimeout(saveNote, 800);
}

function deleteNote(id){
    notes = notes.filter(n=>n.id!==id);
    saveNotesData();
    if(currentNoteId===id){
        currentNoteId=null;
        document.getElementById('noteEditor').style.display='none';
        document.getElementById('emptyEditor').style.display='flex';
    }
    renderNotesList();
}

function deleteCurrentNote(){
    if(currentNoteId) deleteNote(currentNoteId);
}

function setTag(val){
    if(!currentNoteId) return;
    const note = notes.find(n=>n.id===currentNoteId);
    if(note){note.tag=val;note.updated=Date.now();saveNotesData();renderNotesList();}
}

function searchNotes(q){renderNotesList(q.toLowerCase());}

function updateWordCount(){
    const text = document.getElementById('noteBodyInput').value;
    const words = text.trim()?text.trim().split(/\s+/).length:0;
    document.getElementById('wordCount').textContent = words+' word'+(words!==1?'s':'');
}

function insertTemplate(type){
    const ta = document.getElementById('noteBodyInput');
    const templates={bullet:'\n• ',code:'\n```\n\n```',todo:'\n☐ '};
    const pos = ta.selectionStart;
    const t = templates[type]||'';
    ta.value = ta.value.slice(0,pos)+t+ta.value.slice(pos);
    ta.selectionStart = ta.selectionEnd = pos+t.length;
    ta.focus();
    autoSave();
}

renderNotesList();