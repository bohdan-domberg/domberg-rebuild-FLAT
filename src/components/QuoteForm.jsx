import { useState } from 'react';
import '../styles/QuoteForm.css';

/**
 * QuoteForm — the editor panel. Tab-based.
 *
 * The form mutates a single `quoteData` object passed in from the parent.
 * Every change calls `onChange(newData)` with a fresh object — never a
 * mutated copy — so React re-renders cleanly. Image uploads convert files
 * to base64 data URLs (Phase 2 will swap this for Supabase Storage URLs).
 */
const QuoteForm = ({ quoteData, onChange }) => {
  const [tab, setTab] = useState('cover');

  // -------------------- Helpers --------------------
  const update = (patch) => onChange({ ...quoteData, ...patch });
  const updateCover = (patch) =>
    update({ cover: { ...quoteData.cover, ...patch } });
  const updateMeta = (patch) =>
    update({ meta: { ...quoteData.meta, ...patch } });

  /** Read a File and return its base64 data URL */
  const readImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.readAsDataURL(file);
    });

  // -------------------- Item operations --------------------
  const updateItem = (id, patch) =>
    update({
      items: quoteData.items.map((it) =>
        it.id === id ? { ...it, ...patch } : it
      ),
    });

  const removeItem = (id) => {
    if (!window.confirm('Remove this item?')) return;
    update({ items: quoteData.items.filter((it) => it.id !== id) });
  };

  const updateSpec = (itemId, idx, field, value) => {
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    const specs = item.specs.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    updateItem(itemId, { specs });
  };

  const addSpec = (itemId) => {
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      specs: [...item.specs, { label: 'Note', value: '' }],
    });
  };

  const removeSpec = (itemId, idx) => {
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      specs: item.specs.filter((_, i) => i !== idx),
    });
  };

  const handleItemImageUpload = async (itemId, slot, file) => {
    if (!file) return;
    const dataUrl = await readImage(file);
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      images: { ...(item.images || {}), [slot]: dataUrl },
    });
  };

  const clearItemImage = (itemId, slot) => {
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      images: { ...(item.images || {}), [slot]: null },
    });
  };

  // -------------------- Cover image --------------------
  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    const dataUrl = await readImage(file);
    updateCover({ coverImage: dataUrl });
  };

  // -------------------- Terms operations --------------------
  const updateTerm = (idx, patch) =>
    update({
      terms: quoteData.terms.map((t, i) =>
        i === idx ? { ...t, ...patch } : t
      ),
    });

  const addTerm = () =>
    update({
      terms: [
        ...quoteData.terms,
        { title: 'New Clause', body: 'Enter clause text here.' },
      ],
    });

  const removeTerm = (idx) => {
    if (!window.confirm('Remove this terms block?')) return;
    update({ terms: quoteData.terms.filter((_, i) => i !== idx) });
  };

  // -------------------- Render --------------------
  const tabs = [
    { id: 'cover', label: 'Cover' },
    { id: 'items', label: `Items (${quoteData.items.length})` },
    { id: 'terms', label: `Terms (${quoteData.terms.length})` },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="quote-form">
      <div className="form-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="form-content">
        {/* ============================== COVER ============================== */}
        {tab === 'cover' && (
          <div className="tab-content">
            <h3 className="form-title">Cover Page</h3>

            <div className="form-section">
              <h4>Header — left panel</h4>
              <Field label="Category line">
                <input
                  type="text"
                  value={quoteData.cover.category}
                  onChange={(e) => updateCover({ category: e.target.value })}
                />
              </Field>
              <Field
                label="Project name"
                hint="Use a line break (Enter) for two-line names."
              >
                <textarea
                  value={quoteData.cover.projectName}
                  onChange={(e) =>
                    updateCover({ projectName: e.target.value })
                  }
                  rows="2"
                />
              </Field>
              <Field label="Location">
                <input
                  type="text"
                  value={quoteData.cover.location}
                  onChange={(e) => updateCover({ location: e.target.value })}
                />
              </Field>
              <Field label="Client line 1">
                <input
                  type="text"
                  value={quoteData.cover.clientLine1}
                  onChange={(e) =>
                    updateCover({ clientLine1: e.target.value })
                  }
                />
              </Field>
              <Field label="Client line 2 / Ref">
                <input
                  type="text"
                  value={quoteData.cover.clientLine2}
                  onChange={(e) =>
                    updateCover({ clientLine2: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="form-section">
              <h4>Cover image — right panel</h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverImageUpload(e.target.files?.[0])}
              />
              {quoteData.cover.coverImage && (
                <div className="image-preview">
                  <img src={quoteData.cover.coverImage} alt="" />
                  <button
                    className="btn-remove-small"
                    onClick={() => updateCover({ coverImage: null })}
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Footer — six metadata cells</h4>
              <div className="form-grid-2">
                <Field label="Date">
                  <input
                    type="text"
                    value={quoteData.meta.date}
                    onChange={(e) => updateMeta({ date: e.target.value })}
                  />
                </Field>
                <Field label="Version">
                  <input
                    type="text"
                    value={quoteData.meta.version}
                    onChange={(e) => updateMeta({ version: e.target.value })}
                  />
                </Field>
                <Field label="Reference">
                  <input
                    type="text"
                    value={quoteData.meta.reference}
                    onChange={(e) =>
                      updateMeta({ reference: e.target.value })
                    }
                  />
                </Field>
                <Field label="Lead time">
                  <input
                    type="text"
                    value={quoteData.meta.leadTime}
                    onChange={(e) =>
                      updateMeta({ leadTime: e.target.value })
                    }
                  />
                </Field>
                <Field label="Validity">
                  <input
                    type="text"
                    value={quoteData.meta.validity}
                    onChange={(e) =>
                      updateMeta({ validity: e.target.value })
                    }
                  />
                </Field>
                <Field label="Prepared by">
                  <input
                    type="text"
                    value={quoteData.meta.preparedBy}
                    onChange={(e) =>
                      updateMeta({ preparedBy: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Contact">
                <input
                  type="text"
                  value={quoteData.meta.contact}
                  onChange={(e) => updateMeta({ contact: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ============================== ITEMS ============================== */}
        {tab === 'items' && (
          <div className="tab-content">
            <h3 className="form-title">Schedule Items</h3>

            {quoteData.items.length === 0 && (
              <div className="empty-hint">
                No items yet. Use the “+ Item” button in the toolbar.
              </div>
            )}

            {quoteData.items.map((item, idx) => (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <h4>Item {String(idx + 1).padStart(2, '0')}</h4>
                  <button
                    className="btn-remove"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>

                <Field label="Name">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(item.id, { name: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Subtitle / category"
                  hint="Shows in small caps below the name. Optional."
                >
                  <input
                    type="text"
                    value={item.sub || ''}
                    onChange={(e) =>
                      updateItem(item.id, { sub: e.target.value })
                    }
                  />
                </Field>

                {/* ----- Specs (flexible, label is editable) ----- */}
                <div className="spec-block">
                  <div className="spec-block-header">
                    <span>Specification rows</span>
                    <button
                      className="btn-add-spec"
                      onClick={() => addSpec(item.id)}
                    >
                      + Add row
                    </button>
                  </div>
                  {item.specs.map((spec, sidx) => (
                    <div key={sidx} className="spec-edit-row">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) =>
                          updateSpec(item.id, sidx, 'label', e.target.value)
                        }
                        placeholder="Label (e.g. Materials)"
                        className="spec-edit-label"
                      />
                      <textarea
                        value={spec.value}
                        onChange={(e) =>
                          updateSpec(item.id, sidx, 'value', e.target.value)
                        }
                        placeholder="Detail…"
                        rows="2"
                        className="spec-edit-value"
                      />
                      <button
                        className="btn-remove-small"
                        onClick={() => removeSpec(item.id, sidx)}
                        title="Remove this row"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* ----- Pricing ----- */}
                <div className="form-grid-2">
                  <Field label="Unit price (€)">
                    <input
                      type="number"
                      value={item.price}
                      min="0"
                      step="0.01"
                      onChange={(e) =>
                        updateItem(item.id, {
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Field>
                  <Field label="Qty">
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      step="1"
                      onChange={(e) =>
                        updateItem(item.id, {
                          qty: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="line-total">
                  Line total:{' '}
                  <strong>
                    €
                    {((item.price || 0) * (item.qty || 1)).toLocaleString(
                      'en-GB',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </strong>
                </div>

                {/* ----- Images (3 slots) ----- */}
                <div className="image-block">
                  <h5>Images</h5>
                  <div className="image-slots">
                    <ImageSlot
                      label="Main"
                      hint="CAD / arch drawing"
                      value={item.images?.main}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'main', f)
                      }
                      onClear={() => clearItemImage(item.id, 'main')}
                    />
                    <ImageSlot
                      label="Detail 1"
                      hint="Handle / finish"
                      value={item.images?.detail1}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'detail1', f)
                      }
                      onClear={() => clearItemImage(item.id, 'detail1')}
                    />
                    <ImageSlot
                      label="Detail 2"
                      hint="Material / colour"
                      value={item.images?.detail2}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'detail2', f)
                      }
                      onClear={() => clearItemImage(item.id, 'detail2')}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================== TERMS ============================== */}
        {tab === 'terms' && (
          <div className="tab-content">
            <h3 className="form-title">
              Commercial Terms &amp; Conditions
            </h3>

            {quoteData.terms.map((block, idx) => (
              <div key={idx} className="terms-card">
                <div className="item-card-header">
                  <h4>Block {idx + 1}</h4>
                  <button
                    className="btn-remove"
                    onClick={() => removeTerm(idx)}
                  >
                    Remove
                  </button>
                </div>
                <Field label="Title">
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) =>
                      updateTerm(idx, { title: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Body"
                  hint="HTML allowed: use <ul><li>… for bullets, <strong> for bold."
                >
                  <textarea
                    value={block.body}
                    onChange={(e) =>
                      updateTerm(idx, { body: e.target.value })
                    }
                    rows="5"
                  />
                </Field>
              </div>
            ))}

            <button className="btn-add-block" onClick={addTerm}>
              + Add terms block
            </button>
          </div>
        )}

        {/* ============================== SETTINGS ============================== */}
        {tab === 'settings' && (
          <div className="tab-content">
            <h3 className="form-title">Settings</h3>

            <div className="form-section">
              <Field label="VAT rate (%)">
                <input
                  type="number"
                  value={quoteData.vatRate}
                  min="0"
                  max="100"
                  step="0.1"
                  onChange={(e) =>
                    update({
                      vatRate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </Field>
              <p className="hint">
                Used for the IVA line on the totals row. Default 21% for Spain.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Tiny presentational helpers ---
const Field = ({ label, hint, children }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint && <small className="hint">{hint}</small>}
  </label>
);

const ImageSlot = ({ label, hint, value, onUpload, onClear }) => (
  <div className="image-slot">
    <div className="image-slot-label">{label}</div>
    {value ? (
      <>
        <div className="image-slot-preview">
          <img src={value} alt="" />
        </div>
        <button className="btn-remove-small" onClick={onClear}>
          Replace
        </button>
      </>
    ) : (
      <>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <small className="hint">{hint}</small>
      </>
    )}
  </div>
);

export default QuoteForm;
