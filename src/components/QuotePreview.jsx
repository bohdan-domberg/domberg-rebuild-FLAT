import { forwardRef } from 'react';
import '../styles/QuotePreview.css';

const QuotePreview = forwardRef(({ quoteData, totals }, ref) => {
  const euro = (n) =>
    'EUR ' +
    Number(n || 0).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const { cover, meta, items, vatRate, terms, aboutPage } = quoteData;
  const hasImages = items.some(
    (i) => i.images && (i.images.main || i.images.detail1 || i.images.detail2)
  );

  const SplitLogo = ({ size = 200 }) => (
    <div className="logo-split" style={{ height: size, width: size }}>
      <img src="/domberg-logo.svg" className="logo-orange-top" alt="" />
      <img src="/domberg-logo.svg" className="logo-dark-bottom" alt="Domberg" />
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
                <svg width="60" height="52" viewBox="0 0 60 52" fill="none">
                  <rect x="2" y="2" width="56" height="44" rx="3" stroke="#999" strokeWidth="1.5" />
                  <circle cx="16" cy="16" r="6" stroke="#999" strokeWidth="1.5" />
                  <path d="M2 38 L16 24 L28 34 L40 22 L58 40" stroke="#999" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <p className="cover-upload-hint">Cover image</p>
              </div>
            )}
          </div>
        </div>
        <div className="cover-footer">
          <div className="cm-item"><label>Date</label><span>{meta.date}</span></div>
          <div className="cm-item"><label>Version</label><span>{meta.version}</span></div>
          <div className="cm-item"><label>Lead Time</label><span>{meta.leadTime}</span></div>
          <div className="cm-item"><label>Validity</label><span>{meta.validity}</span></div>
          <div className="cm-item"><label>Prepared by</label><span>{meta.preparedBy}</span></div>
          <div className="cm-item"><label>Contact</label><span>{meta.contact}</span></div>
        </div>
      </div>

      {/* ============================== ABOUT PAGE (optional) ============================== */}
      {aboutPage?.enabled && (
        <div className="page about-page">
          <div className="about-header">
            <SplitLogo size={32} />
            <div className="about-header-rule" />
            <div className="about-header-label">About Domberg</div>
          </div>

          <div className="about-body">
            {/* Left column: headline + intro + text blocks */}
            <div className="about-left">
              <h2 className="about-headline">
                {aboutPage.headline || 'Craftsmanship Since 1947'}
              </h2>
              {aboutPage.intro && (
                <p className="about-intro">{aboutPage.intro}</p>
              )}
              <div className="about-blocks">
                {(aboutPage.blocks || []).map((block, i) => (
                  <div key={i} className="about-block">
                    <h3>{block.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: block.body }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: up to 2 images */}
            <div className="about-right">
              {(aboutPage.images || []).map((src, i) =>
                src ? (
                  <div key={i} className="about-img-box">
                    <img src={src} alt="" />
                  </div>
                ) : (
                  <div key={i} className="about-img-box about-img-placeholder">
                    <svg width="36" height="30" viewBox="0 0 36 30" fill="none">
                      <rect x="1" y="1" width="34" height="26" rx="2" stroke="#ccc" strokeWidth="1.2" />
                      <circle cx="10" cy="9" r="3.5" stroke="#ccc" strokeWidth="1.2" />
                      <path d="M1 22 L10 14 L17 20 L24 14 L35 23" stroke="#ccc" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    <span>Image {i + 1}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

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
              const hasMain = !!imgs.main;
              const hasDetail1 = !!imgs.detail1;
              const hasDetail2 = !!imgs.detail2;
              const hasAnyImage = hasMain || hasDetail1 || hasDetail2;
              const showDetailRow = hasDetail1 || hasDetail2;

              return (
                <tr key={item.id} className="item-row">
                  <td className="c-num">{num}</td>
                  <td className="c-img">
                    {hasAnyImage ? (
                      <div className="img-cell-wrap">
                        {hasMain && (
                          <div className="img-main">
                            <div className="img-box">
                              <img src={imgs.main} alt="" data-loaded />
                            </div>
                          </div>
                        )}
                        {showDetailRow && (
                          <div className="img-detail-row">
                            {hasDetail1 && (
                              <div className="img-detail">
                                <div className="img-box">
                                  <img src={imgs.detail1} alt="" data-loaded />
                                </div>
                              </div>
                            )}
                            {hasDetail2 && (
                              <div className="img-detail">
                                <div className="img-box">
                                  <img src={imgs.detail2} alt="" data-loaded />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div className="item-name" dangerouslySetInnerHTML={{ __html: item.name || '' }} />
                    {item.sub && (
                      <div className="item-sub" dangerouslySetInnerHTML={{ __html: item.sub }} />
                    )}
                    <div className="spec-list">
                      {(item.specs || []).map((s, sidx) => (
                        <div key={sidx} className="spec-row">
                          <span className="spec-lbl">{s.label}</span>
                          <span className="spec-val" dangerouslySetInnerHTML={{ __html: s.value || '' }} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="c-price">{euro(item.price)}</td>
                  <td className="c-qty">{item.qty || 1}</td>
                  <td className="c-total"><span className="total-val">{euro(lineTotal)}</span></td>
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
          <a href="https://domberg.es" target="_blank" rel="noreferrer">domberg.es</a>
          <br />
          San Pedro de Alcántara
          <br />
          Marbella, Málaga, España
          <br />
          <a href={`mailto:${meta.contact}`}>{meta.contact}</a>
        </div>
      </div>

    </div>
  );
});

QuotePreview.displayName = 'QuotePreview';
export default QuotePreview;
