import { QUOTE_TYPES } from '../lib/quoteTypes';
import '../styles/NewQuoteModal.css';

/**
 * "New" quote-type picker. Replaces the old single-purpose New button —
 * clicking a card starts a fresh quote of that type via onPick(type.id).
 */
const NewQuoteModal = ({ onPick, onClose }) => (
  <div className="newq-overlay" onClick={onClose}>
    <div className="newq-modal" onClick={(e) => e.stopPropagation()}>
      <div className="newq-header">
        <h3>New Quote</h3>
        <button className="newq-close" onClick={onClose}>✕</button>
      </div>
      <div className="newq-grid">
        {QUOTE_TYPES.map((t) => (
          <button key={t.id} className="newq-card" onClick={() => onPick(t.id)}>
            <span className="newq-card-label">{t.label}</span>
            <span className="newq-card-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default NewQuoteModal;
