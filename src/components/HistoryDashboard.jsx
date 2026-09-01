import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotes, deleteQuote, duplicateQuote } from '../lib/quotesApi';
import { QUOTE_TYPES } from '../lib/quoteTypes';
import '../styles/HistoryDashboard.css';

const statusLabel = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
};

const typeLabel = Object.fromEntries(QUOTE_TYPES.map((t) => [t.id, t.label]));

/** Standard quotes keep their data under `cover`; the newer types under `client`. */
function getRowDisplay(q) {
  const type = q.quote_type || q.data?.quote_type || 'standard';
  const d = q.data || {};
  return type === 'standard'
    ? { type, project: d.cover?.projectName, client: d.cover?.clientLine1 }
    : { type, project: d.client?.project, client: d.client?.name };
}

const HistoryDashboard = () => {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [duplicatingId, setDuplicatingId] = useState(null);
  const duplicatingRef = useRef(false);
  const navigate = useNavigate();

  const load = async (term = '') => {
    setLoading(true);
    setError('');
    try {
      const rows = await listQuotes({ search: term });
      setQuotes(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this quote permanently? This cannot be undone.')) return;
    try {
      await deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      window.alert(err.message);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    if (duplicatingRef.current) return;
    duplicatingRef.current = true;
    setDuplicatingId(id);
    try {
      const newId = await duplicateQuote(id);
      navigate(`/?quote=${newId}`);
    } catch (err) {
      window.alert(err.message);
      duplicatingRef.current = false;
      setDuplicatingId(null);
    }
  };

  return (
    <div className="history-dashboard">
      <div className="history-toolbar">
        <span className="tb-brand">Domberg Quote Generator</span>
        <span className="tb-sep" />
        <button className="tb-btn" onClick={() => navigate('/')}>
          ← Editor
        </button>
        <span className="tb-sep" />
        <form onSubmit={handleSearchSubmit} className="history-search">
          <input
            type="text"
            placeholder="Search by project, client, or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="tb-btn">
            Search
          </button>
        </form>
      </div>

      <div className="history-content">
        {loading && <p className="history-msg">Loading quotes…</p>}
        {error && <p className="history-msg history-error">{error}</p>}
        {!loading && !error && quotes.length === 0 && (
          <p className="history-msg">No quotes saved to the cloud yet.</p>
        )}

        {!loading && quotes.length > 0 && (
          <table className="history-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Project</th>
                <th>Client</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Last updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const row = getRowDisplay(q);
                return (
                  <tr key={q.id} onClick={() => navigate(`/?quote=${q.id}`)}>
                    <td>
                      <span className={`history-type-badge history-type-badge--${row.type}`}>
                        {typeLabel[row.type] || row.type}
                      </span>
                    </td>
                    <td>{row.project || '—'}</td>
                    <td>{row.client || '—'}</td>
                    <td>{q.quote_code || q.data?.meta?.reference || q.data?.meta?.quoteNo || '—'}</td>
                    <td>
                      <span className={`history-status history-status--${q.status}`}>
                        {statusLabel[q.status] || q.status}
                      </span>
                    </td>
                    <td>{new Date(q.updated_at).toLocaleString('en-GB')}</td>
                    <td>
                      <div className="history-actions">
                        <button
                          className="history-duplicate"
                          onClick={(e) => handleDuplicate(q.id, e)}
                          disabled={!!duplicatingId}
                          title="Duplicate quote"
                        >
                          {duplicatingId === q.id ? 'Duplicating…' : 'Duplicate'}
                        </button>
                        <button
                          className="history-delete"
                          onClick={(e) => handleDelete(q.id, e)}
                          title="Delete quote"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryDashboard;
