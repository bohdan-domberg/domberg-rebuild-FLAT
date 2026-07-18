import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotes, deleteQuote } from '../lib/quotesApi';
import '../styles/HistoryDashboard.css';

const statusLabel = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
};

const HistoryDashboard = () => {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
                <th>Project</th>
                <th>Client</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Last updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} onClick={() => navigate(`/?quote=${q.id}`)}>
                  <td>{q.data?.cover?.projectName || '—'}</td>
                  <td>{q.data?.cover?.clientLine1 || '—'}</td>
                  <td>{q.quote_code || q.data?.meta?.reference || '—'}</td>
                  <td>
                    <span className={`history-status history-status--${q.status}`}>
                      {statusLabel[q.status] || q.status}
                    </span>
                  </td>
                  <td>{new Date(q.updated_at).toLocaleString('en-GB')}</td>
                  <td>
                    <button
                      className="history-delete"
                      onClick={(e) => handleDelete(q.id, e)}
                      title="Delete quote"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryDashboard;
