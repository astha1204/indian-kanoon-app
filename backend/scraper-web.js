// ─────────────────────────────────────────────────────────────────────────────
// scraper-web.js  —  Direct HTML scraping of indiankanoon.org
//
// No API token needed. Used as fallback when the API is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

const axios   = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

const webClient = axios.create({
  headers: HEADERS,
  timeout: 15000,
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
async function searchCases(query) {
  const url = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(query)}`;
  const { data } = await webClient.get(url);
  const $ = cheerio.load(data);

  const results = [];

  $('article.result').each((_, el) => {
    const titleEl  = $(el).find('h4.result_title a').first();
    const rawTitle = titleEl.text().trim();
    const fragHref = titleEl.attr('href');

    const headline = $(el).find('.headline').text().trim();
    const court    = $(el).find('.hlbottom .docsource').text().trim();

    const dateMatch = rawTitle.match(/on\s+(\d{1,2}\s+\w+,?\s+\d{4})$/i);
    const date  = dateMatch ? dateMatch[1] : '';
    const title = date
      ? rawTitle.replace(/\s+on\s+\d{1,2}\s+\w+,?\s+\d{4}$/i, '').trim()
      : rawTitle;

    // Prefer the "Full Document" cite_tag href
    let caseUrl = '';
    $(el).find('.hlbottom .cite_tag').each((_, tag) => {
      if ($(tag).text().trim() === 'Full Document') {
        const href = $(tag).attr('href');
        if (href) caseUrl = `https://indiankanoon.org${href}`;
      }
    });

    // Fallback: derive from docfragment href
    if (!caseUrl && fragHref) {
      const m = fragHref.match(/\/docfragment\/(\d+)\//);
      if (m)                          caseUrl = `https://indiankanoon.org/doc/${m[1]}/`;
      else if (fragHref.startsWith('/doc/')) caseUrl = `https://indiankanoon.org${fragHref}`;
    }

    const citeTags = $(el).find('.hlbottom .cite_tag');
    const cites    = $(citeTags[0]).text().trim();
    const citedBy  = $(citeTags[1]).text().trim();

    if (title && caseUrl) {
      results.push({ title, court, date, headline, cites, citedBy, url: caseUrl, source: 'web' });
    }
  });

  return results;
}

// ── FETCH FULL CASE ───────────────────────────────────────────────────────────
async function fetchCase(caseUrl) {
  const { data } = await webClient.get(caseUrl);
  const $ = cheerio.load(data);

  const title = $('h2.doc_title').text().trim()
    || $('h1.doc_title').text().trim()
    || $('title').text().replace('Indian Kanoon -', '').trim();

  const court = $('h3.docsource_main').text().trim()
    || $('.docsource_main').text().trim();

  const paragraphs = [];

  // ── Strategy 1: <pre id="pre_1"> blocks (Jharkhand HC, older courts) ──────
  // Your screenshot confirmed this is the most common pattern
  $('pre[id^="pre_"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });

  // ── Strategy 2: Any <pre> block (fallback for pre without id) ─────────────
  if (paragraphs.length === 0) {
    $('pre').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 100) paragraphs.push(text);
    });
  }

  // ── Strategy 3: AKN format (Supreme Court, newer judgments) ───────────────
  if (paragraphs.length === 0) {
    $('span.akn-p, p.akn-p, akn-remark').each((_, el) => {
      const text = $(el).text().trim();
      if (text) paragraphs.push(text);
    });
  }

  // ── Strategy 4: Paragraphs inside known judgment containers ───────────────
  if (paragraphs.length === 0) {
    const containers = ['#judgments', '.judgments', '.doc_content', '#doc_content', '#judgment', '.judgment'];
    for (const sel of containers) {
      if ($(sel).length > 0) {
        $(sel).find('p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) paragraphs.push(text);
        });
        if (paragraphs.length > 0) break;
      }
    }
  }

  // ── Strategy 5: Nuclear — strip nav/scripts, take everything ──────────────
  if (paragraphs.length === 0) {
    const clone = $('#main_doc, #content, body').first().clone();
    clone.find('script, style, nav, header, footer, .ad, #search, .search').remove();
    clone.text().trim()
      .split(/\n{2,}/)
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 20)
      .forEach(p => paragraphs.push(p));
  }

  const fullText = paragraphs.join('\n\n');
  console.log(`[WEB] ${caseUrl} → ${fullText.length} chars`);

  return {
    url: caseUrl, title, court, source: 'web',
    text: fullText || 'No judgment text could be extracted.',
  };
}

module.exports = { searchCases, fetchCase };