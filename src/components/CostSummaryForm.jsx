import { useRef, useState } from 'react';
import { getNextQuoteReference } from '../lib/quotesApi';
import { compressAndUpload } from '../lib/imageUpload';
import { uploadDocument, deleteUploadedDocument } from '../lib/documentUpload';
import { mergePdfs, downloadBlob } from '../lib/pdfMerge';
import { Field, BulletListEditor } from './FormFields';
import ImageLibraryModal from './ImageLibraryModal';
import '../styles/FormFields.css';
import '../styles/CostSummaryForm.css';

const euro = (n) =>
  '€ ' + Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * CostSummaryForm — shared editor for quote_type 'flooring' and 'windows'.
 * The two share ~90% of the same shape (client/meta/surface/includes/
 * excludes); `variant` drives the few differences: material vs system
 * label, the manual-override Total UI (flooring) vs optional-price/m² Total
 * UI (windows), and the install-areas list (flooring only).
 */
const CostSummaryForm = ({ quoteData, onChange, variant, totals }) => {
  const isFlooring = variant === 'flooring';
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [merging, setMerging] = useState(false);
  const mergeInputRef = useRef(null);

  const update = (patch) => onChange({ ...quoteData, ...patch });
  const updateClient = (patch) => update({ client: { ...quoteData.client, ...patch } });
  const updateMeta = (patch) => update({ meta: { ...quoteData.meta, ...patch } });
  const updatePricing = (patch) => update({ pricing: { ...(quoteData.pricing || {}), ...patch } });

  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await compressAndUpload(file, 'quote-images', 'cover');
      update({ coverImage: url });
    } catch (err) {
      window.alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const attachments = quoteData.attachments || [];

  const handleAttachmentUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('Please choose a PDF file.');
      return;
    }
    setUploadingDoc(true);
    try {
      const url = await uploadDocument(file, 'attachments');
      update({
        attachments: [...attachments, { id: Date.now(), name: file.name, url, sizeBytes: file.size }],
      });
    } catch (err) {
      window.alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeAttachment = (id) => {
    const att = attachments.find((a) => a.id === id);
    if (!window.confirm(`Remove "${att?.name || 'this file'}"?`)) return;
    update({ attachments: attachments.filter((a) => a.id !== id) });
    if (att?.url) deleteUploadedDocument(att.url);
  };

  const moveAttachment = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= attachments.length) return;
    const next = [...attachments];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    update({ attachments: next });
  };

  const handleMergeFileChosen = async (e) => {
    const quoteFile = e.target.files?.[0];
    e.target.value = '';
    if (!quoteFile) return;
    setMerging(true);
    try {
      const blob = await mergePdfs([quoteFile, ...attachments]);
      const safeName = (quoteData.client?.project || 'quote')
        .replace(/[^a-zA-Z0-9 _-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      downloadBlob(blob, `domberg-${safeName || 'quote'}-combined.pdf`);
    } catch (err) {
      window.alert(`Merge failed: ${err.message}`);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="cost-summary-form">
      <div className="form-content">
        <h3 className="form-title">{isFlooring ? 'Hardwood / Flooring Quote' : 'Windows / Structures Quote'}</h3>

        <div className="form-section">
          <h4>Cover photo</h4>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingCover}
            onChange={(e) => handleCoverImageUpload(e.target.files?.[0])}
          />
          {uploadingCover && <small className="hint">Uploading…</small>}
          <button type="button" className="btn-library-link" onClick={() => setShowLibrary(true)}>
            or choose from library
          </button>
          {quoteData.coverImage && (
            <div className="image-preview">
              <img src={quoteData.coverImage} alt="" />
              <button className="btn-remove-small" onClick={() => update({ coverImage: null })}>
                Remove image
              </button>
            </div>
          )}
          {showLibrary && (
            <ImageLibraryModal
              onSelect={(url) => {
                update({ coverImage: url });
                setShowLibrary(false);
              }}
              onClose={() => setShowLibrary(false)}
            />
          )}
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
        </div>

        <div className="form-section">
          <h4>Cost summary</h4>
          <Field label={isFlooring ? 'Material spec' : 'System / brand'}>
            <input
              type="text"
              value={isFlooring ? quoteData.material : quoteData.system}
              onChange={(e) => update(isFlooring ? { material: e.target.value } : { system: e.target.value })}
              placeholder={isFlooring ? 'e.g. Oak Select Parket - English Herringbone' : 'e.g. Aluminum Windows - Reynaers'}
            />
          </Field>

          <div className="form-grid-2">
            <Field label="Surface (m²)">
              <input
                type="number"
                step="0.01"
                value={quoteData.surfaceM2}
                onChange={(e) => update({ surfaceM2: e.target.value })}
              />
            </Field>

            {isFlooring ? (
              <Field label="Price / m² (€)">
                <input
                  type="number"
                  step="0.01"
                  value={quoteData.pricePerM2}
                  onChange={(e) => update({ pricePerM2: e.target.value })}
                />
              </Field>
            ) : (
              <Field label="Price / m² (€)" hint="Leave blank for a flat total.">
                <input
                  type="number"
                  step="0.01"
                  value={quoteData.pricePerM2 ?? ''}
                  onChange={(e) => update({ pricePerM2: e.target.value === '' ? null : e.target.value })}
                />
              </Field>
            )}
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={quoteData.showPricePerM2 !== false}
              onChange={(e) => update({ showPricePerM2: e.target.checked })}
            />
            <span>Show Price/m² column to the client</span>
          </label>
          <p className="hint" style={{ marginTop: -4, marginBottom: 10 }}>
            Turn off to show only the total on the printed quote — useful when you don't want the
            per-m² rate visible to the client.
          </p>

          {isFlooring ? (
            <>
              <p className="hint cs-computed-total">Auto-calculated total: {euro(totals?.computed)}</p>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={!!quoteData.pricing?.manualOverride}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updatePricing({ manualOverride: true, manualTotal: (totals?.computed || 0).toFixed(2) });
                    } else {
                      updatePricing({ manualOverride: false });
                    }
                  }}
                />
                <span>Manually set the total</span>
              </label>
              {quoteData.pricing?.manualOverride && (
                <Field label="Total (€)">
                  <input
                    type="number"
                    step="0.01"
                    value={quoteData.pricing.manualTotal ?? ''}
                    onChange={(e) => updatePricing({ manualTotal: e.target.value })}
                  />
                </Field>
              )}
            </>
          ) : totals?.auto ? (
            <Field label="Total (€)" hint="Computed from Surface × Price/m² — clear Price/m² to type a flat total instead.">
              <input type="number" value={totals.total.toFixed(2)} readOnly disabled />
            </Field>
          ) : (
            <Field label="Total (€)">
              <input
                type="number"
                step="0.01"
                value={quoteData.manualTotal}
                onChange={(e) => update({ manualTotal: e.target.value })}
              />
            </Field>
          )}
        </div>

        <div className="form-section">
          <h4>Copy</h4>
          <BulletListEditor
            label="The cost includes"
            items={quoteData.includes}
            onChange={(includes) => update({ includes })}
            placeholder="e.g. Delivery of materials."
          />
          <BulletListEditor
            label="The cost does not include"
            items={quoteData.excludes}
            onChange={(excludes) => update({ excludes })}
            placeholder="e.g. IVA"
          />
          {isFlooring && (
            <BulletListEditor
              label="Installation areas"
              items={quoteData.installAreas}
              onChange={(installAreas) => update({ installAreas })}
              placeholder="e.g. Dormitorio Principal"
            />
          )}
        </div>

        <div className="form-section">
          <h4>Shop drawings / attachments</h4>
          <p className="hint" style={{ marginTop: -4 }}>
            Attach supplier PDFs (shop drawings etc). These aren't part of the printed quote
            itself — use "Merge with printed quote PDF" below to combine them with your quote
            into one file, in the order listed here.
          </p>
          <input
            type="file"
            accept="application/pdf"
            disabled={uploadingDoc}
            onChange={(e) => handleAttachmentUpload(e.target.files?.[0])}
          />
          {uploadingDoc && <small className="hint">Uploading…</small>}

          {attachments.length > 0 && (
            <div className="attachment-list">
              {attachments.map((att, idx) => (
                <div key={att.id} className="attachment-row">
                  <a href={att.url} target="_blank" rel="noreferrer" className="attachment-name">
                    {att.name}
                  </a>
                  <div className="attachment-actions">
                    <button type="button" className="btn-move" disabled={idx === 0} onClick={() => moveAttachment(idx, -1)} title="Move up">↑</button>
                    <button type="button" className="btn-move" disabled={idx === attachments.length - 1} onClick={() => moveAttachment(idx, 1)} title="Move down">↓</button>
                    <button type="button" className="btn-remove" onClick={() => removeAttachment(att.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn-suggest"
            style={{ marginTop: 10 }}
            disabled={merging}
            onClick={() => mergeInputRef.current?.click()}
            title="Pick the quote PDF you just printed/saved — it'll be combined with the attachments above into one file"
          >
            {merging ? 'Merging…' : 'Merge with printed quote PDF…'}
          </button>
          <input
            ref={mergeInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleMergeFileChosen}
            style={{ display: 'none' }}
          />
          <p className="hint">
            Print the quote to PDF first (toolbar above), then use this to pick that file and
            merge it with the attachments — no need for a separate PDF tool.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CostSummaryForm;
