const list    = document.getElementById('noteList');
const input   = document.getElementById('noteInput');
const addBtn  = document.getElementById('addBtn');
const countEl = document.getElementById('count');

async function loadNotes() {
  const res   = await fetch('/api/notes');
  const notes = await res.json();
  render(notes);
}

function render(notes) {
  countEl.textContent = notes.length;

  if (notes.length === 0) {
    list.innerHTML = '<p class="empty">Keine Notizen vorhanden.</p>';
    return;
  }

  list.innerHTML = notes.map(n => `
    <li class="${n.done ? 'done' : ''}" data-id="${n.id}">
      <button class="check-btn" title="Abhaken">${n.done ? '✓' : ''}</button>
      <span class="note-text">${escHtml(n.text)}</span>
      <button class="del-btn" title="Löschen">✕</button>
    </li>
  `).join('');

  list.querySelectorAll('.check-btn, .note-text').forEach(el => {
    el.addEventListener('click', () => toggleNote(el.closest('li').dataset.id));
  });

  list.querySelectorAll('.del-btn').forEach(el => {
    el.addEventListener('click', () => deleteNote(el.closest('li').dataset.id));
  });
}

async function addNote() {
  const text = input.value.trim();
  if (!text) return;

  await fetch('/api/notes', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ text }),
  });

  input.value = '';
  loadNotes();
}

async function toggleNote(id) {
  await fetch(`/api/notes/${id}`, { method: 'PATCH' });
  loadNotes();
}

async function deleteNote(id) {
  await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  loadNotes();
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

addBtn.addEventListener('click', addNote);
input.addEventListener('keydown', e => e.key === 'Enter' && addNote());

loadNotes();
