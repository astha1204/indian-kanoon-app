import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3001';

export default function App() {
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading,  setCaseLoading]  = useState(false);
  const [error,        setError]        = useState('');

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setSelectedCase(null);
    setError('');

    try {
      const res = await axios.get(`${API}/search`, { params: { query } });
      if (res.data.length === 0) setError('No results found. Try a different query.');
      setResults(res.data);
    } catch (err) {
      setError('Search failed. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  // ── Case click ────────────────────────────────────────────────────────────
  const handleCaseClick = async (caseUrl) => {
    setCaseLoading(true);
    setSelectedCase(null);
    setError('');
    window.scrollTo(0, 0);

    try {
      const res = await axios.get(`${API}/case`, { params: { url: caseUrl } });
      setSelectedCase(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
      setError(`Failed to load case: ${detail}`);
    } finally {
      setCaseLoading(false);
    }
  };

  return (
    <div className="app-container">

      {/* ── HEADER ── */}
      <div className="app-header">
        <h1>⚖️ Indian Kanoon Search</h1>
        <p>Search Indian court judgments and legal documents</p>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="search-bar">
        <input
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. property dispute, murder, section 302..."
        />
        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="error-banner">{error}</div>
      )}

      {/* ── SEARCH LOADING ── */}
      {loading && (
        <div className="loading-state">
          <div className="loading-icon">⏳</div>
          <p>Fetching results from Indian Kanoon...</p>
        </div>
      )}

      {/* ── RESULTS LIST ── */}
      {!selectedCase && !loading && results.map((c, i) => (
        <div
          key={i}
          className="result-card"
          onClick={() => handleCaseClick(c.url)}
        >
          <div className="result-title">{c.title}</div>

          <div className="result-meta">
            {c.court && <span className="meta-item">🏛️ {c.court}</span>}
            {c.date  && <span className="meta-item">📅 {c.date}</span>}
          </div>

          {c.headline && (
            <div className="result-snippet">{c.headline}</div>
          )}

          <div className="result-citations">
            {c.cites   && <span>📎 {c.cites}</span>}
            {c.citedBy && <span>🔗 {c.citedBy}</span>}
          </div>
        </div>
      ))}

      {/* ── CASE LOADING ── */}
      {caseLoading && (
        <div className="loading-state">
          <div className="loading-icon">📄</div>
          <p>Loading judgment text...</p>
        </div>
      )}

      {/* ── CASE DETAIL ── */}
      {selectedCase && !caseLoading && (
        <div>
          <button className="back-btn" onClick={() => setSelectedCase(null)}>
            ← Back to Results
          </button>

          {selectedCase.title && (
            <h2 className="case-title">{selectedCase.title}</h2>
          )}
          {selectedCase.court && (
            <p className="case-court">🏛️ {selectedCase.court}</p>
          )}

          <div className="case-text">{selectedCase.text}</div>
        </div>
      )}

    </div>
  );
}