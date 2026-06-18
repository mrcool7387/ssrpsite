const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store
let notes = [
  { id: 1, text: 'Express ist einfach zu lernen', done: false },
  { id: 2, text: 'Node.js läuft serverseitig', done: true },
];
let nextId = 3;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/notes', (req, res) => {
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text fehlt' });
  const note = { id: nextId++, text: text.trim(), done: false };
  notes.push(note);
  res.status(201).json(note);
});

app.patch('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === Number(req.params.id));
  if (!note) return res.status(404).json({ error: 'Nicht gefunden' });
  note.done = !note.done;
  res.json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const index = notes.findIndex(n => n.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Nicht gefunden' });
  notes.splice(index, 1);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
