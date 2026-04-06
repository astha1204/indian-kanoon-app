require('dotenv').config();  // ← add this
const express = require('express');
const cors    = require('cors');
const { searchCases, fetchCase } = require('./scraper');

const app  = express();
const PORT = 3001;

// cors() allows your frontend (localhost:3000) to call this backend
// Without this, the browser will block the request
app.use(cors());

// ── ROUTE 1: Health check ───────────────────────────────────────────────────
// Visit http://localhost:3001/health to confirm server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── ROUTE 2: Search ─────────────────────────────────────────────────────────
// Visit http://localhost:3001/search?query=murder
// req.query.query gives us the "murder" part
app.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' });
  }

  try {
    // 🔥 NEW: Check if query is a numeric ID
    if (/^\d+$/.test(query)) {
      const url = `https://indiankanoon.org/doc/${query}/`;

      const caseData = await fetchCase(url);

      // return as array to keep response format consistent
      return res.json([caseData]);
    }

    // 🔁 Existing behavior
    const results = await searchCases(query);
    res.json(results);

  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// ── ROUTE 3: Full case ──────────────────────────────────────────────────────
// Visit http://localhost:3001/case?url=https://indiankanoon.org/doc/12345/
app.get('/case', async (req, res) => {

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url parameter is required' });
  }

  try {
    const caseData = await fetchCase(url);
    res.json(caseData);
  } catch (err) {
    console.error('Case fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});