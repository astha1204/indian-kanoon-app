// ─────────────────────────────────────────────────────────────────────────────
// scraper-api.js  —  Uses the OFFICIAL Indian Kanoon API
//
// Docs:  https://api.indiankanoon.org
// Auth:  Generate a token on their website → set IK_TOKEN env variable
// Usage: IK_TOKEN=your_token_here node index.js
// ─────────────────────────────────────────────────────────────────────────────

const axios   = require('axios');
const cheerio = require('cheerio');

const IK_TOKEN = process.env.IK_TOKEN || '';

const apiClient = axios.create({
  baseURL: 'https://api.indiankanoon.org',
  headers: {
    'Authorization': `Token ${IK_TOKEN}`,
    'Accept':        'application/json',
  },
  timeout: 10000,
});

// ── Helper: strip HTML tags returned in API snippets ─────────────────────────
function stripHtml(html) {
  if (!html) return '';
  const $ = cheerio.load(html);
  return $.text().trim();
}

// ── Helper: doc ID from IK URL
function extractDocId(url) {
  const match = url.match(/\/doc\/(\d+)/);
  return match ? match[1] : null;
}

// ── Check if the API token looks usable
function isTokenSet() {
  return IK_TOKEN && IK_TOKEN !== 'YOUR_TOKEN_HERE' && IK_TOKEN.length > 5;
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
// POST https://api.indiankanoon.org/search/
async function searchCases(query) {
  if (!isTokenSet()) throw new Error('IK_TOKEN not set — skipping API');

  const params = new URLSearchParams();
  params.append('formInput', query);
  params.append('pagenum', '0');

  const { data } = await apiClient.post('/search/', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const docs = data.docs || [];
  if (docs.length === 0) return [];

  return docs.map(doc => ({
    title:    doc.title       || '(Untitled)',
    court:    doc.docsource   || '',
    date:     doc.publishdate || '',
    headline: doc.headline    ? stripHtml(doc.headline) : '',
    cites:    doc.cites       ? `Cites ${doc.cites}`       : '',
    citedBy:  doc.citedby     ? `Cited by ${doc.citedby}`  : '',
    url:      `https://indiankanoon.org/doc/${doc.tid}/`,
    docId:    doc.tid,
    source:   'api',
  }));
}

// ── FETCH FULL CASE ───────────────────────────────────────────────────────────
// POST https://api.indiankanoon.org/doc/<docid>/
async function fetchCase(caseUrl) {
  if (!isTokenSet()) throw new Error('IK_TOKEN not set — skipping API');

  const docId = extractDocId(caseUrl);
  if (!docId) throw new Error(`Cannot extract doc ID from: ${caseUrl}`);

  const { data } = await apiClient.post(`/doc/${docId}/`);

  const title = data.title     || '(Untitled)';
  const court = data.docsource || '';
  let fullText = '';

  if (data.doc) {
    const $ = cheerio.load(data.doc);
    const paragraphs = [];

    // A: <pre id="pre_1">, <pre id="pre_2"> … (Jharkhand HC, older courts)
    $('pre[id^="pre_"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });

    // B: AKN spans (Supreme Court, newer judgments)
    if (paragraphs.length === 0) {
      $('span.akn-p, p.akn-p').each((_, el) => {
        const text = $(el).text().trim();
        if (text) paragraphs.push(text);
      });
    }

    // C: plain <p> tags
    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });
    }

    // D: nuclear — raw text of whatever the API returned
    if (paragraphs.length === 0) {
      $.text().trim()
        .split(/\n{2,}/)
        .map(p => p.replace(/\s+/g, ' ').trim())
        .filter(p => p.length > 20)
        .forEach(p => paragraphs.push(p));
    }

    fullText = paragraphs.join('\n\n');
  }

  console.log(`[API] docId=${docId} → ${fullText.length} chars`);

  return {
    url: caseUrl, docId, title, court, source: 'api',
    text: fullText || 'No judgment text found in API response.',
  };
}

module.exports = { searchCases, fetchCase, isTokenSet };