import '../styles/FormFields.css';

/** Plain labeled field wrapper — label + input/textarea + optional hint. */
export const Field = ({ label, hint, children }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint && <small className="hint">{hint}</small>}
  </label>
);

/**
 * Editable list of plain-text lines with add/remove — used for the
 * includes / excludes / installation-areas lists on cost-summary quotes.
 */
export const BulletListEditor = ({ label, hint, items, onChange, placeholder }) => {
  const list = items || [];

  const update = (idx, value) => {
    const next = [...list];
    next[idx] = value;
    onChange(next);
  };
  const remove = (idx) => onChange(list.filter((_, i) => i !== idx));
  const add = () => onChange([...list, '']);

  return (
    <div className="field bullet-list-field">
      <span className="field-label">{label}</span>
      {list.map((val, idx) => (
        <div key={idx} className="bullet-list-row">
          <input
            type="text"
            value={val}
            placeholder={placeholder}
            onChange={(e) => update(idx, e.target.value)}
          />
          <button
            type="button"
            className="btn-remove-small"
            onClick={() => remove(idx)}
            title="Remove line"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn-add-line" onClick={add}>
        + Add line
      </button>
      {hint && <small className="hint">{hint}</small>}
    </div>
  );
};
