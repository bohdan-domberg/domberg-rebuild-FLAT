import { forwardRef } from 'react';
import '../styles/QuotePreview.css';

/**
 * QuotePreview — faithful port of the Jasmine HTML quote template.
 *
 * Structure mirrors the original:
 *   1. Cover page          (split logo, project info, cover image, 6-cell footer)
 *   2. Quote section       (single shared table, all items with 3 image slots each)
 *   3. Totals row          (subtotal / IVA / grand total — inside the quote section)
 *   4. Terms page          (6 editable blocks)
 *   5. Back page           (logo + contact line)
 */
const QuotePreview = forwardRef(({ quoteData, totals }, ref) => {
  const euro = (n) =>
    'EUR ' +
    Number(n || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const { cover, meta, items, vatRate, terms } = quoteData;
  const hasImages = items.some(
    (i) => i.images && (i.images.main || i.images.detail1 || i.images.detail2)
  );

  // Inline SVG placeholder used in image slots when no upload yet.
  const ImagePlaceholder = ({ big }) => (
    <>
      <svg
        className="img-placeholder-icon"
        width={big ? 28 : 20}
        height={big ? 24 : 18}
        viewBox="0 0 28 24"
        fill="none"
      >
        <rect
          x="1"
          y="1"
          width="26"
          height="20"
          rx="2"
          stroke="#bbb"
          strokeWidth="1.2"
        />
        <circle cx="8" cy="8" r="3" stroke="#bbb" strokeWidth="1.2" />
        <path
          d="M1 18 L8 11 L14 16 L20 12 L27 19"
          stroke="#bbb"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  // Reusable split logo (orange icon top, dark wordmark bottom).
  // Relies on the SVG filter defined in App.jsx and the .logo-split CSS rules.
  const SplitLogo = ({ size = 200 }) => (
    <div className="logo-split" style={{ height: size, width: size }}>
      <img src="/domberg-logo.svg" className="logo-orange-top" alt="" />
      <img
        src="/domberg-logo.svg"
        className="logo-dark-bottom"
        alt="Domberg"
      />
    </div>
  );

  return (
    <div ref={ref} className="quote-preview">
      {/* ============================== COVER ============================== */}
      <div className="page cover-page">
        <div className="cover-body">
          <div className="cover-left">
            <div className="cl-top">
              <SplitLogo size={200} />
              <div className="cl-rule" />
              <div className="cl-category">{cover.category}</div>
              <div
                className="cl-name"
                dangerouslySetInnerHTML={{
                  __html: (cover.projectName || '').replace(/\n/g, '<br>'),
                }}
              />
              <div className="cl-loc">{cover.location}</div>
            </div>
            <div className="cl-client">
              {cover.clientLine1 && <div>{cover.clientLine1}</div>}
              {cover.clientLine2 && <div>{cover.clientLine2}</div>}
            </div>
          </div>
          <div className="cover-right">
            {cover.coverImage ? (
              <img id="cover-img" src={cover.coverImage} alt="" />
            ) : (
              <div className="cr-placeholder">
                <svg
                  width="60"
                  height="52"
                  viewBox="0 0 60 52"
                  fill="none"
                >
                  <rect
                    x="2"
                    y="2"
                    width="56"
                    height="44"
                    rx="3"
                    stroke="#999"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="6"
                    stroke="#999"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M2 38 L16 24 L28 34 L40 22 L58 40"
                    stroke="#999"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="cover-upload-hint">Cover image</p>
              </div>
            )}
          </div>
        </div>
        <div className="cover-footer">
          <div className="cm-item">
            <label>Date</label>
            <span>{meta.date}</span>
          </div>
          <div className="cm-item">
            <label>Version</label>
            <span>{meta.version}</span>
          </div>
          <div className="cm-item">
            <label>Lead Time</label>
            <span>{meta.leadTime}</span>
          </div>
          <div className="cm-item">
            <label>Validity</label>
            <span>{meta.validity}</span>
          </div>
          <div className="cm-item">
            <label>Prepared by</label>
            <span>{meta.preparedBy}</span>
          </div>
          <div className="cm-item">
            <label>Contact</label>
            <span>{meta.contact}</span>
          </div>
        </div>
      </div>

      {/* ============================== QUOTE ============================== */}
      <div className="quote-section">
        <div className="quote-header">
          <div className="qh-l">
            <SplitLogo size={24} />
            <div className="ref">
              {cover.projectName?.replace(/\n/g, ' ')} · Commercial Proposal{' '}
              {meta.reference} · v{meta.version}
            </div>
          </div>
          <div className="qh-r">
            <div className="ql">Itemised Schedule</div>
            <span>{meta.date}</span>
          </div>
        </div>

        <table id="quote-table" className={hasImages ? 'has-images' : ''}>
          <colgroup>
            <col style={{ width: '10mm' }} />
            <col className="col-img" style={{ width: '88mm' }} />
            <col />
            <col style={{ width: '28mm' }} />
            <col style={{ width: '13mm' }} />
            <col style={{ width: '28mm' }} />
          </colgroup>
          <thead>
            <tr>
              <th>No.</th>
              <th className="th-img">Images</th>
              <th>Item &amp; Specification</th>
              <th className="r">Unit Price</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th className="r">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const num = String(idx + 1).padStart(2, '0');
              const lineTotal = (item.price || 0) * (item.qty || 1);
              const imgs = item.images || {};
              return (
                <tr key={item.id} className="item-row">
                  <td className="c-num">{num}</td>
                  <td className="c-img">
                    <div className="img-cell-wrap">
                      <div className="img-main">
                        <div className="img-box">
                          {imgs.main ? (
                            <img src={imgs.main} alt="" data-loaded />
                          ) : (
                            <>
                              <ImagePlaceholder big />
                              <div className="img-placeholder-text">
                                Main image
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="img-detail-row">
                        <div className="img-detail">
                          <div className="img-box">
                            {imgs.detail1 ? (
                              <img src={imgs.detail1} alt="" data-loaded />
                            ) : (
                              <>
                                <ImagePlaceholder />
                                <div className="img-placeholder-text">
                                  Detail
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="img-detail">
                          <div className="img-box">
                            {imgs.detail2 ? (
                              <img src={imgs.detail2} alt="" data-loaded />
                            ) : (
                              <>
                                <ImagePlaceholder />
                                <div className="img-placeholder-text">
                                  Detail
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      className="item-name"
                      dangerouslySetInnerHTML={{ __html: item.name || '' }}
                    />
                    {item.sub && (
                      <div
                        className="item-sub"
                        dangerouslySetInnerHTML={{ __html: item.sub }}
                      />
                    )}
                    <div className="spec-list">
                      {(item.specs || []).map((s, sidx) => (
                        <div key={sidx} className="spec-row">
                          <span className="spec-lbl">{s.label}</span>
                          <span
                            className="spec-val"
                            dangerouslySetInnerHTML={{ __html: s.value || '' }}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="c-price">{euro(item.price)}</td>
                  <td className="c-qty">{item.qty || 1}</td>
                  <td className="c-total">
                    <span className="total-val">{euro(lineTotal)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="totals-wrap">
          <div className="totals-inner">
            <div className="tot-row">
              <span className="tot-lbl">Subtotal ex. IVA</span>
              <span className="tot-val">{euro(totals.subtotal)}</span>
            </div>
            <div className="tot-row">
              <span className="tot-lbl">IVA {vatRate}%</span>
              <span className="tot-val">{euro(totals.iva)}</span>
            </div>
            <div className="tot-row grand">
              <span className="tot-lbl">Total incl. IVA</span>
              <span className="tot-val">{euro(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================== TERMS ============================== */}
      <div className="page terms-page">
        <div className="terms-ttl">Commercial Terms &amp; Conditions</div>
        <div className="terms-grid">
          {terms.map((block, i) => (
            <div key={i} className="terms-block">
              <h3>{block.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: block.body }} />
            </div>
          ))}
        </div>
      </div>

      {/* ============================== BACK ============================== */}
      <div className="page back-page">
        <SplitLogo size={250} />
        <div className="back-rule" />
        <div className="back-contact">
          domberg.es
          <br />
          San Pedro de Alcantara
          <br />
          Marbella, Malaga, Espana
        </div>
      </div>
    </div>
  );
});

QuotePreview.displayName = 'QuotePreview';
export default QuotePreview;
