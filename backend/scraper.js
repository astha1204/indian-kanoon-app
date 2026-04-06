// ─────────────────────────────────────────────────────────────────────────────
// scraper.js  —  Smart router
//
// Tries the official Indian Kanoon API first.
// If the token isn't set OR the API call fails → falls back to web scraping.
//
// This is the ONLY file index.js imports.  scraper-api.js and scraper-web.js
// are never imported directly by the rest of the app.
// ─────────────────────────────────────────────────────────────────────────────

const api = require('./scraper-api');
const web = require('./scraper-web');

// ── SEARCH ────────────────────────────────────────────────────────────────────
async function searchCases(query) {
  if (api.isTokenSet()) {
    try {
      console.log('[router] searchCases → trying API...');
      const results = await api.searchCases(query);
      console.log(`[router] API returned ${results.length} results`);
      return results;
    } catch (err) {
      console.warn(`[router] API search failed (${err.message}) → falling back to web scraping`);
    }
  } else {
    console.log('[router] IK_TOKEN not set → using web scraping');
  }

  const results = await web.searchCases(query);
  console.log(`[router] Web scrape returned ${results.length} results`);
  return results;
}

// ── FETCH FULL CASE ───────────────────────────────────────────────────────────
async function fetchCase(caseUrl) {
  if (api.isTokenSet()) {
    try {
      console.log(`[router] fetchCase → trying API for ${caseUrl}`);
      const result = await api.fetchCase(caseUrl);
      console.log(`[router] API fetched case: "${result.title}"`);
      return result;
    } catch (err) {
      console.warn(`[router] API case fetch failed (${err.message}) → falling back to web scraping`);
    }
  } else {
    console.log('[router] IK_TOKEN not set → using web scraping');
  }

  const result = await web.fetchCase(caseUrl);
  console.log(`[router] Web scraped case: "${result.title}"`);
  return result;
}

module.exports = { searchCases, fetchCase };