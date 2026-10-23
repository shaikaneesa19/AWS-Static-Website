/* ══════════════════════════════════════════════════════
   AWS Cloud Website — Express Backend Server
   ══════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Data file paths ────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// ── Ensure data directory and files exist ──────────────
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize data files if they don't exist
if (!fs.existsSync(MESSAGES_FILE)) {
  writeJSON(MESSAGES_FILE, []);
}
if (!fs.existsSync(STATS_FILE)) {
  writeJSON(STATS_FILE, { totalVisitors: 0, uniqueVisitors: [], dailyStats: {} });
}

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════

// ── 1. VISITOR COUNTER ─────────────────────────────────

// Track a visit (called by frontend on page load)
app.post('/api/visit', (req, res) => {
  const stats = readJSON(STATS_FILE, { totalVisitors: 0, uniqueVisitors: [], dailyStats: {} });
  const visitorIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Increment total page views
  stats.totalVisitors += 1;

  // Track unique visitors by IP
  if (!stats.uniqueVisitors.includes(visitorIP)) {
    stats.uniqueVisitors.push(visitorIP);
  }

  // Track daily stats
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = { views: 0, unique: [] };
  }
  stats.dailyStats[today].views += 1;
  if (!stats.dailyStats[today].unique.includes(visitorIP)) {
    stats.dailyStats[today].unique.push(visitorIP);
  }

  writeJSON(STATS_FILE, stats);

  res.json({
    success: true,
    totalVisitors: stats.totalVisitors,
    uniqueVisitors: stats.uniqueVisitors.length
  });
});

// Get visitor stats (public — shown on frontend)
app.get('/api/stats', (req, res) => {
  const stats = readJSON(STATS_FILE, { totalVisitors: 0, uniqueVisitors: [], dailyStats: {} });
  res.json({
    totalPageViews: stats.totalVisitors,
    uniqueVisitors: stats.uniqueVisitors.length
  });
});

// ── 2. CONTACT FORM ────────────────────────────────────

// Submit a contact message
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'A valid email is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }

  const messages = readJSON(MESSAGES_FILE, []);
  const newMessage = {
    id: uuidv4(),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    starred: false
  };

  messages.unshift(newMessage); // newest first
  writeJSON(MESSAGES_FILE, messages);

  console.log(`📧 New message from ${newMessage.name} <${newMessage.email}>`);

  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully!'
  });
});

// ── 3. ADMIN API (Dashboard) ───────────────────────────

// Get all messages
app.get('/api/admin/messages', (req, res) => {
  const messages = readJSON(MESSAGES_FILE, []);
  res.json({
    total: messages.length,
    unread: messages.filter(m => !m.read).length,
    starred: messages.filter(m => m.starred).length,
    messages
  });
});

// Mark a message as read
app.patch('/api/admin/messages/:id/read', (req, res) => {
  const messages = readJSON(MESSAGES_FILE, []);
  const msg = messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  msg.read = true;
  writeJSON(MESSAGES_FILE, messages);
  res.json({ success: true, message: msg });
});

// Toggle star on a message
app.patch('/api/admin/messages/:id/star', (req, res) => {
  const messages = readJSON(MESSAGES_FILE, []);
  const msg = messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  msg.starred = !msg.starred;
  writeJSON(MESSAGES_FILE, messages);
  res.json({ success: true, message: msg });
});

// Delete a message
app.delete('/api/admin/messages/:id', (req, res) => {
  let messages = readJSON(MESSAGES_FILE, []);
  const index = messages.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Message not found.' });

  messages.splice(index, 1);
  writeJSON(MESSAGES_FILE, messages);
  res.json({ success: true });
});

// Get full admin dashboard stats
app.get('/api/admin/dashboard', (req, res) => {
  const stats = readJSON(STATS_FILE, { totalVisitors: 0, uniqueVisitors: [], dailyStats: {} });
  const messages = readJSON(MESSAGES_FILE, []);

  // Last 7 days chart data
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = stats.dailyStats[dateStr] || { views: 0, unique: [] };
    last7Days.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      views: day.views,
      unique: Array.isArray(day.unique) ? day.unique.length : 0
    });
  }

  res.json({
    totalPageViews: stats.totalVisitors,
    uniqueVisitors: stats.uniqueVisitors.length,
    totalMessages: messages.length,
    unreadMessages: messages.filter(m => !m.read).length,
    starredMessages: messages.filter(m => m.starred).length,
    recentMessages: messages.slice(0, 5),
    last7Days
  });
});

// ── Serve admin dashboard ──────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── Fallback — serve index.html for any unknown route ──
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ══════════════════════════════════════════════');
  console.log('  ☁  AWS Cloud Website — Server Running');
  console.log('  ══════════════════════════════════════════════');
  console.log(`  🌐  Frontend : http://localhost:${PORT}`);
  console.log(`  🔧  Admin    : http://localhost:${PORT}/admin`);
  console.log(`  📡  API      : http://localhost:${PORT}/api`);
  console.log('  ══════════════════════════════════════════════');
  console.log('');
});
