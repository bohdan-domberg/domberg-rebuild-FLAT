import { useEffect, useRef, useState } from 'react';
import { searchCatalog, saveCatalogItem } from '../lib/applianceCatalog';

/**
 * Search-as-you-type dropdown embedded on an Appliance item's description
 * field. Typing searches `appliance_catalog` (debounced); picking a result
 * fills matNo/desc/listPrice on the row. "Save" persists the row's current
 * values back to the catalog so future quotes can find it — the catalog has
 * no bulk-import UI, it grows one saved item at a time.
 */
const ApplianceCatalogPicker = ({ descValue, matNo, listPrice, onDescChange, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open || !descValue || descValue.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchCatalog(descValue));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [descValue, open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSave = async () => {
    if (!descValue?.trim()) {
      window.alert('Enter a description before saving to the catalog.');
      return;
    }
    const brand = window.prompt('Brand (e.g. Miele) for this catalog entry:', '');
    if (brand === null) return;
    try {
      await saveCatalogItem({ brand, model: matNo, description: descValue, listPrice });
      window.alert('Saved to catalog.');
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="catalog-picker" ref={wrapRef}>
      <div className="catalog-picker-input-row">
        <input
          type="text"
          value={descValue}
          placeholder="Search catalog or type a description…"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onDescChange(e.target.value);
            setOpen(true);
          }}
        />
        <button
          type="button"
          className="btn-save-catalog"
          title="Save this item to the catalog"
          onClick={handleSave}
        >
          ⤓
        </button>
      </div>
      {open && (loading || results.length > 0) && (
        <div className="catalog-dropdown">
          {loading && <div className="catalog-dropdown-msg">Searching…</div>}
          {!loading &&
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                className="catalog-dropdown-row"
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
              >
                <span className="cd-brand">{r.brand}</span>
                <span className="cd-desc">{r.description}</span>
                <span className="cd-price">€{Number(r.list_price || 0).toFixed(2)}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default ApplianceCatalogPicker;
