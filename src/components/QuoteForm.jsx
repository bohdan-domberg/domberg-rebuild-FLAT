import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { compressAndUpload } from '../lib/imageUpload';
import { getNextQuoteReference } from '../lib/quotesApi';
import ImageLibraryModal from './ImageLibraryModal';
import '../styles/QuoteForm.css';

/**
 * QuoteForm — the editor panel. Tab-based.
 *
 * The form mutates a single `quoteData` object passed in from the parent.
 * Every change calls `onChange(newData)` with a fresh object — never a
 * mutated copy — so React re-renders cleanly. Image uploads convert files
 * to base64 data URLs (Phase 2 will swap this for Supabase Storage URLs).
 */

// -------------------- RichField toolbar --------------------
// Wraps a textarea with a B / I / U / orange toolbar.
// When text is selected, it wraps the selection in the tag.
// When nothing is selected, it inserts the tag pair with cursor inside.
const RichField = ({ label, hint, value, onChange, rows = 2, fieldRef }) => {
  const textareaRef = useRef(null);

  const applyTag = useCallback(
    (openTag, closeTag) => {
      const el = textareaRef.current;
      if (!el) return;

      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = value.slice(start, end);

      let newValue;
      let cursorStart;
      let cursorEnd;

      if (selected) {
        // Wrap selection
        newValue =
          value.slice(0, start) +
          openTag +
          selected +
          closeTag +
          value.slice(end);
        cursorStart = start + openTag.length;
        cursorEnd = cursorStart + selected.length;
      } else {
        // Insert tags, cursor between them
        newValue =
          value.slice(0, start) + openTag + closeTag + value.slice(start);
        cursorStart = start + openTag.length;
        cursorEnd = cursorStart;
      }

      onChange(newValue);

      // Restore focus + cursor position after React re-render
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [value, onChange]
  );

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        applyTag('<strong>', '</strong>');
      } else if (e.key === 'i') {
        e.preventDefault();
        applyTag('<em>', '</em>');
      } else if (e.key === 'u') {
        e.preventDefault();
        applyTag('<u>', '</u>');
      }
    }
  };

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="rich-toolbar">
        <button
          type="button"
          className="rt-btn"
          title="Bold — Ctrl+B"
          onMouseDown={(e) => {
            e.preventDefault(); // don't blur the textarea
            applyTag('<strong>', '</strong>');
          }}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="rt-btn"
          title="Italic — Ctrl+I"
          onMouseDown={(e) => {
            e.preventDefault();
            applyTag('<em>', '</em>');
          }}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="rt-btn"
          title="Underline — Ctrl+U"
          onMouseDown={(e) => {
            e.preventDefault();
            applyTag('<u>', '</u>');
          }}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className="rt-btn rt-btn-orange"
          title="Orange"
          onMouseDown={(e) => {
            e.preventDefault();
            applyTag('<span class="hl-orange">', '</span>');
          }}
        >
          A
        </button>
      </div>
      <textarea
        ref={(el) => {
          textareaRef.current = el;
          if (fieldRef) fieldRef(el);
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={rows}
      />
      {hint && <small className="hint">{hint}</small>}
    </label>
  );
};

const QuoteForm = forwardRef(({ quoteData, onChange }, ref) => {
  const [tab, setTab] = useState('cover');
  // Tracks which image slots are mid-upload, e.g. { 'item-123-main': true }
  const [uploading, setUploading] = useState({});
  // Which slot the library modal should fill when a pick is made, e.g.
  // { type: 'cover' } or { type: 'item', itemId, slot: 'main' }
  const [libraryTarget, setLibraryTarget] = useState(null);
  // Collapsed item cards (compact summary row instead of the full form) —
  // manual toggle only, never set for a freshly added/duplicated item.
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  // { id, token } — scrolls/focuses an item card. token (not just id) makes
  // repeat-jumps to the same item re-trigger the effect below.
  const [focusTarget, setFocusTarget] = useState(null);
  const itemRefs = useRef({}); // item.id -> .item-card DOM node
  const nameFieldRefs = useRef({}); // item.id -> Name textarea DOM node

  // Smooth-scrolls + focuses an item card whenever focusTarget changes.
  // preventScroll on the focus call stops the browser's native focus-scroll
  // from fighting the smooth scrollIntoView animation.
  useEffect(() => {
    if (!focusTarget) return;
    const cardEl = itemRefs.current[focusTarget.id];
    if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const nameEl = nameFieldRefs.current[focusTarget.id];
    if (nameEl) nameEl.focus({ preventScroll: true });
  }, [focusTarget]);

  // -------------------- Helpers --------------------
  const update = (patch) => onChange({ ...quoteData, ...patch });
  const updateCover = (patch) =>
    update({ cover: { ...quoteData.cover, ...patch } });
  const updateMeta = (patch) =>
    update({ meta: { ...quoteData.meta, ...patch } });
  const updateAboutPage = (patch) =>
    update({ aboutPage: { ...quoteData.aboutPage, ...patch } });
  const updatePricing = (patch) =>
    update({ pricing: { ...quoteData.pricing, ...patch } });

  /** Compresses + uploads a file to Supabase Storage, tracking a per-slot spinner. */
  const uploadImage = async (key, file, bucket, prefix) => {
    if (!file) return null;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      return await compressAndUpload(file, bucket, prefix);
    } catch (err) {
      window.alert(`Image upload failed: ${err.message}`);
      return null;
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

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

  const moveItem = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= quoteData.items.length) return;
    const items = [...quoteData.items];
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    update({ items });
  };

  const stripTags = (html) => (html || '').replace(/<[^>]*>/g, '');

  const toggleCollapsed = (id) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const collapseAll = () => setCollapsedIds(new Set(quoteData.items.map((i) => i.id)));
  const expandAll = () => setCollapsedIds(new Set());

  /** Switches to the items tab, expands the target item if collapsed, and
   * scrolls/focuses it (see the useEffect above watching focusTarget). */
  const requestFocus = (id) => {
    setTab('items');
    setCollapsedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFocusTarget({ id, token: Date.now() + Math.random() });
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: 'New Item',
      sub: '',
      specs: [
        { label: 'Dimensions', value: '' },
        { label: 'Materials', value: '' },
        { label: 'Hardware', value: '' },
      ],
      price: 0,
      qty: 1,
      images: { main: null, detail1: null, detail2: null },
    };
    update({ items: [...quoteData.items, newItem] });
    requestFocus(newItem.id);
  };

  /** Clones name/sub/specs/price/qty (and display prefs) — not photos —
   * into a new item inserted right after the original. */
  const duplicateItem = (idx) => {
    const original = quoteData.items[idx];
    const clone = {
      id: Date.now(),
      name: original.name,
      sub: original.sub,
      specs: original.specs.map((s) => ({ ...s })),
      price: original.price,
      qty: original.qty,
      imageSize: original.imageSize,
      imageFit: original.imageFit,
      images: { main: null, detail1: null, detail2: null },
    };
    const items = [...quoteData.items];
    items.splice(idx + 1, 0, clone);
    update({ items });
    requestFocus(clone.id);
  };

  useImperativeHandle(ref, () => ({ addItem, jumpToItem: requestFocus }), [quoteData]);

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
    const url = await uploadImage(`item-${itemId}-${slot}`, file, 'quote-images', `item-${itemId}`);
    if (!url) return;
    const item = quoteData.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      images: { ...(item.images || {}), [slot]: url },
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
    const url = await uploadImage('cover', file, 'quote-images', 'cover');
    if (!url) return;
    updateCover({ coverImage: url });
  };

  const handleAboutImageUpload = async (idx, file) => {
    if (!file) return;
    const url = await uploadImage(`about-${idx}`, file, 'about-images', 'about');
    if (!url) return;
    const images = [...(quoteData.aboutPage?.images || [])];
    images[idx] = url;
    updateAboutPage({ images });
  };

  const clearAboutImage = (idx) => {
    const images = [...(quoteData.aboutPage?.images || [])];
    images[idx] = null;
    updateAboutPage({ images });
  };

  const handleLibrarySelect = (url) => {
    if (!libraryTarget) return;
    if (libraryTarget.type === 'cover') {
      updateCover({ coverImage: url });
    } else if (libraryTarget.type === 'item') {
      const item = quoteData.items.find((i) => i.id === libraryTarget.itemId);
      if (item) {
        updateItem(libraryTarget.itemId, {
          images: { ...(item.images || {}), [libraryTarget.slot]: url },
        });
      }
    } else if (libraryTarget.type === 'about') {
      const images = [...(quoteData.aboutPage?.images || [])];
      images[libraryTarget.idx] = url;
      updateAboutPage({ images });
    }
    setLibraryTarget(null);
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
    { id: 'about', label: 'About Page' },
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
                disabled={uploading.cover}
                onChange={(e) => handleCoverImageUpload(e.target.files?.[0])}
              />
              {uploading.cover && <small className="hint">Uploading…</small>}
              <button
                type="button"
                className="btn-library-link"
                onClick={() => setLibraryTarget({ type: 'cover' })}
              >
                or choose from library
              </button>
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
                  <div className="field-with-btn">
                    <input
                      type="text"
                      value={quoteData.meta.reference}
                      onChange={(e) =>
                        updateMeta({ reference: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="btn-suggest"
                      title="Suggest the next DE26 reference"
                      onClick={() =>
                        getNextQuoteReference().then((ref) => updateMeta({ reference: ref }))
                      }
                    >
                      Suggest
                    </button>
                  </div>
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

            <div className="items-toolbar">
              <select
                className="items-toolbar-jump"
                value=""
                onChange={(e) => {
                  if (e.target.value) requestFocus(Number(e.target.value));
                }}
              >
                <option value="">Jump to item…</option>
                {quoteData.items.map((it, i) => (
                  <option key={it.id} value={it.id}>
                    {String(i + 1).padStart(2, '0')} — {stripTags(it.name) || 'New Item'}
                  </option>
                ))}
              </select>
              <div className="items-toolbar-actions">
                <button type="button" className="btn-move" onClick={addItem}>
                  + Add item
                </button>
                <button type="button" className="btn-move" onClick={collapseAll}>
                  Collapse all
                </button>
                <button type="button" className="btn-move" onClick={expandAll}>
                  Expand all
                </button>
              </div>
            </div>

            {quoteData.items.length === 0 && (
              <div className="empty-hint">
                No items yet. Use the "+ Add item" button above.
              </div>
            )}

            {quoteData.items.map((item, idx) => {
              const isCollapsed = collapsedIds.has(item.id);
              return (
              <div
                key={item.id}
                className={`item-card${isCollapsed ? ' item-card--collapsed' : ''}`}
                ref={(el) => {
                  if (el) itemRefs.current[item.id] = el;
                  else delete itemRefs.current[item.id];
                }}
              >
                <div className="item-card-header">
                  <button
                    type="button"
                    className="btn-move item-card-collapse-toggle"
                    onClick={() => toggleCollapsed(item.id)}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isCollapsed ? '▸' : '▾'}
                  </button>
                  <h4>
                    {isCollapsed
                      ? `${String(idx + 1).padStart(2, '0')} — ${stripTags(item.name) || 'New Item'} — €${(item.price || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })} × ${item.qty || 1}`
                      : `Item ${String(idx + 1).padStart(2, '0')}`}
                  </h4>
                  <div className="item-card-header-actions">
                    <button
                      className="btn-move"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="btn-move"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === quoteData.items.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="btn-move"
                      onClick={() => duplicateItem(idx)}
                      title="Duplicate item"
                    >
                      ⧉ Duplicate
                    </button>
                    <button
                      className="btn-remove"
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                <>
                <RichField
                  label="Name"
                  value={item.name || ''}
                  onChange={(v) => updateItem(item.id, { name: v })}
                  fieldRef={(el) => { nameFieldRefs.current[item.id] = el; }}
                />
                <RichField
                  label="Subtitle / category"
                  hint="Shows in small caps below the name. Optional."
                  value={item.sub || ''}
                  onChange={(v) => updateItem(item.id, { sub: v })}
                />

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
                      <SpecValueField
                        value={spec.value || ''}
                        onChange={(v) =>
                          updateSpec(item.id, sidx, 'value', v)
                        }
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

                  <div className="image-controls">
                    <Field label="Display size" hint="Try Large for a hero shot, Compact for small details">
                      <select
                        value={item.imageSize || 'standard'}
                        onChange={(e) => updateItem(item.id, { imageSize: e.target.value })}
                      >
                        <option value="compact">Compact</option>
                        <option value="standard">Standard</option>
                        <option value="large">Large</option>
                      </select>
                    </Field>
                    <Field label="Fit" hint="'Show full image' never crops; 'Fill & crop' fills the box edge-to-edge">
                      <select
                        value={item.imageFit || 'contain'}
                        onChange={(e) => updateItem(item.id, { imageFit: e.target.value })}
                      >
                        <option value="contain">Show full image (no crop)</option>
                        <option value="cover">Fill box &amp; crop</option>
                      </select>
                    </Field>
                  </div>

                  <div className="image-slots">
                    <ImageSlot
                      label="Main"
                      hint="CAD / arch drawing"
                      value={item.images?.main}
                      loading={uploading[`item-${item.id}-main`]}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'main', f)
                      }
                      onClear={() => clearItemImage(item.id, 'main')}
                      onPickLibrary={() =>
                        setLibraryTarget({ type: 'item', itemId: item.id, slot: 'main' })
                      }
                    />
                    <ImageSlot
                      label="Detail 1"
                      hint="Handle / finish"
                      value={item.images?.detail1}
                      loading={uploading[`item-${item.id}-detail1`]}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'detail1', f)
                      }
                      onClear={() => clearItemImage(item.id, 'detail1')}
                      onPickLibrary={() =>
                        setLibraryTarget({ type: 'item', itemId: item.id, slot: 'detail1' })
                      }
                    />
                    <ImageSlot
                      label="Detail 2"
                      hint="Material / colour"
                      value={item.images?.detail2}
                      loading={uploading[`item-${item.id}-detail2`]}
                      onUpload={(f) =>
                        handleItemImageUpload(item.id, 'detail2', f)
                      }
                      onClear={() => clearItemImage(item.id, 'detail2')}
                      onPickLibrary={() =>
                        setLibraryTarget({ type: 'item', itemId: item.id, slot: 'detail2' })
                      }
                    />
                  </div>
                </div>
                </>
                )}
              </div>
              );
            })}

            <button type="button" className="btn-add-block" onClick={addItem}>
              + Add item
            </button>
          </div>
        )}

        {/* ============================== TERMS ============================== */}
        {/* ============================== ABOUT PAGE ============================== */}
        {tab === 'about' && (
          <div className="tab-content">
            <h3 className="form-title">About Domberg Page</h3>
            <p className="hint" style={{ marginTop: -8, marginBottom: 16 }}>
              Toggle this page on/off from the toolbar button. When on, it's inserted right after the cover page.
            </p>

            <div className="form-section">
              <h4>Intro</h4>
              <Field label="Headline">
                <input
                  type="text"
                  value={quoteData.aboutPage?.headline || ''}
                  onChange={(e) => updateAboutPage({ headline: e.target.value })}
                />
              </Field>
              <RichField
                label="Intro paragraph"
                value={quoteData.aboutPage?.intro || ''}
                onChange={(v) => updateAboutPage({ intro: v })}
                rows={4}
              />
            </div>

            <div className="form-section">
              <h4>Text blocks (2×2 grid)</h4>
              {(quoteData.aboutPage?.blocks || []).map((block, idx) => (
                <div key={idx} className="form-subsection">
                  <Field label={`Block ${idx + 1} — title`}>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => {
                        const blocks = [...quoteData.aboutPage.blocks];
                        blocks[idx] = { ...blocks[idx], title: e.target.value };
                        updateAboutPage({ blocks });
                      }}
                    />
                  </Field>
                  <RichField
                    label={`Block ${idx + 1} — body`}
                    value={block.body}
                    onChange={(v) => {
                      const blocks = [...quoteData.aboutPage.blocks];
                      blocks[idx] = { ...blocks[idx], body: v };
                      updateAboutPage({ blocks });
                    }}
                    rows={3}
                  />
                </div>
              ))}
            </div>

            <div className="form-section">
              <h4>Images — right-hand column (2 slots)</h4>
              <div className="image-slots">
                <ImageSlot
                  label="Image 1"
                  hint="Workshop / craftsmanship shot"
                  value={quoteData.aboutPage?.images?.[0]}
                  loading={uploading['about-0']}
                  onUpload={(f) => handleAboutImageUpload(0, f)}
                  onClear={() => clearAboutImage(0)}
                  onPickLibrary={() => setLibraryTarget({ type: 'about', idx: 0 })}
                />
                <ImageSlot
                  label="Image 2"
                  hint="Installation / finished project"
                  value={quoteData.aboutPage?.images?.[1]}
                  loading={uploading['about-1']}
                  onUpload={(f) => handleAboutImageUpload(1, f)}
                  onClear={() => clearAboutImage(1)}
                  onPickLibrary={() => setLibraryTarget({ type: 'about', idx: 1 })}
                />
              </div>
            </div>
          </div>
        )}

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
                <RichField
                  label="Body"
                  hint="B/I/U buttons or Ctrl+B/I/U. Also: <ul><li>… for bullets."
                  value={block.body}
                  onChange={(v) => updateTerm(idx, { body: v })}
                  rows={5}
                />
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

            <div className="form-section">
              <h4>VAT display</h4>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={quoteData.pricing?.vatEnabled !== false}
                  onChange={(e) => updatePricing({ vatEnabled: e.target.checked })}
                />
                <span>Show VAT breakdown (Subtotal / IVA / Total)</span>
              </label>
              <p className="hint">
                Unchecked: the quote shows a single "Total" line with the price excluding VAT — no breakdown.
              </p>
            </div>

            <div className="form-section">
              <h4>Discount / rounding adjustment</h4>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!quoteData.pricing?.discountEnabled}
                  onChange={(e) => updatePricing({ discountEnabled: e.target.checked })}
                />
                <span>Apply a discount or rounding adjustment before VAT</span>
              </label>
              <p className="hint">
                Subtracted from the item subtotal before VAT is calculated. Ignored while manual override (below) is on.
              </p>

              {quoteData.pricing?.discountEnabled && (
                <div className="form-grid-2" style={{ marginTop: 10 }}>
                  <Field label="Label on the quote">
                    <input
                      type="text"
                      value={quoteData.pricing.discountLabel || ''}
                      onChange={(e) => updatePricing({ discountLabel: e.target.value })}
                      placeholder="Discount"
                    />
                  </Field>
                  <Field label="Type">
                    <select
                      value={quoteData.pricing.discountType || 'percent'}
                      onChange={(e) => updatePricing({ discountType: e.target.value })}
                    >
                      <option value="percent">Percentage off</option>
                      <option value="fixed">Fixed amount off</option>
                    </select>
                  </Field>
                  <Field label={quoteData.pricing.discountType === 'fixed' ? 'Amount (€)' : 'Percentage (%)'}>
                    <input
                      type="number"
                      step="0.01"
                      value={quoteData.pricing.discountValue ?? ''}
                      onChange={(e) => updatePricing({ discountValue: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Manual price override</h4>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!quoteData.pricing?.manualOverride}
                  onChange={(e) => {
                    const enabling = e.target.checked;
                    if (enabling) {
                      // Seed the manual fields with the current auto-calculated
                      // numbers so you're editing from a sane starting point.
                      const computedSubtotal = quoteData.items.reduce(
                        (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
                        0
                      );
                      const computedIva =
                        (computedSubtotal * (Number(quoteData.vatRate) || 0)) / 100;
                      const computedTotal = computedSubtotal + computedIva;
                      updatePricing({
                        manualOverride: true,
                        manualSubtotal: computedSubtotal.toFixed(2),
                        manualIva: computedIva.toFixed(2),
                        manualTotal: computedTotal.toFixed(2),
                      });
                    } else {
                      updatePricing({ manualOverride: false });
                    }
                  }}
                />
                <span>Manually set the final Subtotal / VAT / Total</span>
              </label>
              <p className="hint">
                When on, these numbers are used exactly as typed instead of being calculated from the item prices.
              </p>

              {quoteData.pricing?.manualOverride && (
                <div className="form-grid-2" style={{ marginTop: 10 }}>
                  <Field label="Subtotal (ex. VAT)">
                    <input
                      type="number"
                      step="0.01"
                      value={quoteData.pricing.manualSubtotal ?? ''}
                      onChange={(e) => updatePricing({ manualSubtotal: e.target.value })}
                    />
                  </Field>
                  <Field label="VAT amount">
                    <input
                      type="number"
                      step="0.01"
                      value={quoteData.pricing.manualIva ?? ''}
                      onChange={(e) => updatePricing({ manualIva: e.target.value })}
                    />
                  </Field>
                  <Field label="Total (incl. VAT)">
                    <input
                      type="number"
                      step="0.01"
                      value={quoteData.pricing.manualTotal ?? ''}
                      onChange={(e) => updatePricing({ manualTotal: e.target.value })}
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {libraryTarget && (
        <ImageLibraryModal
          onSelect={handleLibrarySelect}
          onClose={() => setLibraryTarget(null)}
        />
      )}
    </div>
  );
});

QuoteForm.displayName = 'QuoteForm';

// --- Plain Field (no toolbar) ---
const Field = ({ label, hint, children }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint && <small className="hint">{hint}</small>}
  </label>
);

// --- Spec value field: inline B/I/U/orange toolbar without the label wrapper ---
// Used inside the spec-edit-row grid where the label column is separate.
const SpecValueField = ({ value, onChange }) => {
  const textareaRef = useRef(null);

  const applyTag = useCallback(
    (openTag, closeTag) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = value.slice(start, end);
      let newValue, cursorStart, cursorEnd;
      if (selected) {
        newValue =
          value.slice(0, start) + openTag + selected + closeTag + value.slice(end);
        cursorStart = start + openTag.length;
        cursorEnd = cursorStart + selected.length;
      } else {
        newValue = value.slice(0, start) + openTag + closeTag + value.slice(start);
        cursorStart = start + openTag.length;
        cursorEnd = cursorStart;
      }
      onChange(newValue);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [value, onChange]
  );

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); applyTag('<strong>', '</strong>'); }
      else if (e.key === 'i') { e.preventDefault(); applyTag('<em>', '</em>'); }
      else if (e.key === 'u') { e.preventDefault(); applyTag('<u>', '</u>'); }
    }
  };

  return (
    <div className="spec-value-wrap">
      <div className="rich-toolbar rich-toolbar--inline">
        <button type="button" className="rt-btn" title="Bold — Ctrl+B"
          onMouseDown={(e) => { e.preventDefault(); applyTag('<strong>', '</strong>'); }}>
          <strong>B</strong>
        </button>
        <button type="button" className="rt-btn" title="Italic — Ctrl+I"
          onMouseDown={(e) => { e.preventDefault(); applyTag('<em>', '</em>'); }}>
          <em>I</em>
        </button>
        <button type="button" className="rt-btn" title="Underline — Ctrl+U"
          onMouseDown={(e) => { e.preventDefault(); applyTag('<u>', '</u>'); }}>
          <u>U</u>
        </button>
        <button type="button" className="rt-btn rt-btn-orange" title="Orange"
          onMouseDown={(e) => { e.preventDefault(); applyTag('<span class="hl-orange">', '</span>'); }}>
          A
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Detail…"
        rows={2}
        className="spec-edit-value"
      />
    </div>
  );
};

const ImageSlot = ({ label, hint, value, onUpload, onClear, loading, onPickLibrary }) => (
  <div className="image-slot">
    <div className="image-slot-label">{label}</div>
    {loading ? (
      <small className="hint">Uploading…</small>
    ) : value ? (
      <>
        <div className="image-slot-preview">
          <img src={value} alt="" />
        </div>
        <div className="image-slot-actions">
          <button className="btn-remove-small" onClick={onClear}>
            Replace
          </button>
          {onPickLibrary && (
            <button className="btn-remove-small" onClick={onPickLibrary}>
              Library
            </button>
          )}
        </div>
      </>
    ) : (
      <>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        {onPickLibrary && (
          <button type="button" className="btn-library-link" onClick={onPickLibrary}>
            or choose from library
          </button>
        )}
        <small className="hint">{hint}</small>
      </>
    )}
  </div>
);

export default QuoteForm;
