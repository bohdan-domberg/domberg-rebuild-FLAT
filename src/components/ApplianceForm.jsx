import { getNextQuoteReference } from '../lib/quotesApi';
import { Field } from './FormFields';
import ApplianceCatalogPicker from './ApplianceCatalogPicker';
import '../styles/FormFields.css';
import '../styles/ApplianceForm.css';

const euro = (n) =>
  '€ ' + Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * ApplianceForm — editor panel for quote_type: 'appliance'. Single
 * sectioned page (no tabs needed, the shape is simple): branding + client +
 * meta + discount + item rows + a read-only totals strip.
 */
const ApplianceForm = ({ quoteData, onChange, totals }) => {
  const update = (patch) => onChange({ ...quoteData, ...patch });
  const updateClient = (patch) => update({ client: { ...quoteData.client, ...patch } });
  const updateMeta = (patch) => update({ meta: { ...quoteData.meta, ...patch } });

  const updateItem = (id, patch) =>
    update({ items: quoteData.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });

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

  const addItem = () =>
    update({
      items: [
        ...quoteData.items,
        { id: Date.now(), matNo: '', desc: '', link: '', qty: 1, listPrice: 0 },
      ],
    });

  const rows = totals?.rows || quoteData.items;

  return (
    <div className="appliance-form">
      <div className="form-content">
        <h3 className="form-title">Appliance Quote</h3>

        <div className="form-section">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={!!quoteData.branded}
              onChange={(e) => update({ branded: e.target.checked })}
            />
            <span>DOMBERG branding (unchecked = white-label)</span>
          </label>
        </div>

        <div className="form-section">
          <h4>Client</h4>
          <Field label="Name">
            <input type="text" value={quoteData.client.name} onChange={(e) => updateClient({ name: e.target.value })} />
          </Field>
          <Field label="Project">
            <input type="text" value={quoteData.client.project} onChange={(e) => updateClient({ project: e.target.value })} />
          </Field>
          <Field label="Address">
            <input type="text" value={quoteData.client.address} onChange={(e) => updateClient({ address: e.target.value })} />
          </Field>
          <div className="form-grid-2">
            <Field label="Email">
              <input type="text" value={quoteData.client.email} onChange={(e) => updateClient({ email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input type="text" value={quoteData.client.phone} onChange={(e) => updateClient({ phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Prepared by">
            <input type="text" value={quoteData.client.preparedBy} onChange={(e) => updateClient({ preparedBy: e.target.value })} />
          </Field>
        </div>

        <div className="form-section">
          <h4>Quote details</h4>
          <Field label="Quote No.">
            <div className="field-with-btn">
              <input type="text" value={quoteData.meta.quoteNo} onChange={(e) => updateMeta({ quoteNo: e.target.value })} />
              <button
                type="button"
                className="btn-suggest"
                title="Suggest the next DE26 reference"
                onClick={() => getNextQuoteReference().then((ref) => updateMeta({ quoteNo: ref }))}
              >
                Suggest
              </button>
            </div>
          </Field>
          <div className="form-grid-2">
            <Field label="Date">
              <input type="text" value={quoteData.meta.date} onChange={(e) => updateMeta({ date: e.target.value })} />
            </Field>
            <Field label="Valid until">
              <input type="text" value={quoteData.meta.validUntil} onChange={(e) => updateMeta({ validUntil: e.target.value })} />
            </Field>
          </div>
          <Field label="Discount %" hint="A single global discount applied to every line before VAT.">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={quoteData.discountPct}
              onChange={(e) => update({ discountPct: e.target.value })}
            />
          </Field>
        </div>

        <div className="form-section">
          <h4>Items ({quoteData.items.length})</h4>
          {quoteData.items.length === 0 && <p className="empty-hint">No items yet — add one below, or search the catalog.</p>}

          {quoteData.items.map((item, idx) => (
            <div key={item.id} className="item-card appliance-item-card">
              <div className="item-card-header">
                <h4>Item {idx + 1}</h4>
                <div className="item-card-header-actions">
                  <button type="button" className="btn-move" disabled={idx === 0} onClick={() => moveItem(idx, -1)} title="Move up">↑</button>
                  <button type="button" className="btn-move" disabled={idx === quoteData.items.length - 1} onClick={() => moveItem(idx, 1)} title="Move down">↓</button>
                  <button type="button" className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>

              <div className="form-grid-2">
                <Field label="Item No. (SKU)">
                  <input type="text" value={item.matNo} onChange={(e) => updateItem(item.id, { matNo: e.target.value })} />
                </Field>
                <Field label="Qty">
                  <input type="number" min="0" value={item.qty} onChange={(e) => updateItem(item.id, { qty: e.target.value })} />
                </Field>
              </div>

              <Field label="Description" hint="Search the catalog as you type, or type a description manually.">
                <ApplianceCatalogPicker
                  descValue={item.desc}
                  matNo={item.matNo}
                  listPrice={item.listPrice}
                  onDescChange={(v) => updateItem(item.id, { desc: v })}
                  onSelect={(r) =>
                    updateItem(item.id, {
                      matNo: r.model || item.matNo,
                      desc: r.description || item.desc,
                      listPrice: r.list_price ?? item.listPrice,
                    })
                  }
                />
              </Field>

              <div className="form-grid-2">
                <Field label="Spec link (optional)">
                  <input type="text" value={item.link} onChange={(e) => updateItem(item.id, { link: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="List price (€)">
                  <input type="number" step="0.01" value={item.listPrice} onChange={(e) => updateItem(item.id, { listPrice: e.target.value })} />
                </Field>
              </div>

              <p className="hint appliance-row-total">
                Net unit {euro(rows[idx]?.net)} · Line total {euro(rows[idx]?.lineTotal)}
              </p>
            </div>
          ))}

          <button type="button" className="btn-add-line" onClick={addItem}>+ Add item</button>
        </div>

        <div className="form-section appliance-totals-strip">
          <div className="ats-row"><span>Subtotal (excl. VAT)</span><span>{euro(totals?.subtotal)}</span></div>
          <div className="ats-row"><span>VAT 21%</span><span>{euro(totals?.vat)}</span></div>
          <div className="ats-row ats-grand"><span>Total incl. VAT</span><span>{euro(totals?.grand)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ApplianceForm;
