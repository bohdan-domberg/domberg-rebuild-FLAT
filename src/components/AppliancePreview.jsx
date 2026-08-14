import '../styles/AppliancePreview.css';

const euro = (n) =>
  Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * AppliancePreview — direct port of appliance_quote.html's print layout.
 * Root class toggles branded/whitelabel to swap the --accent CSS variable
 * (brand orange vs white-label gold) and show/hide the logo mark, exactly
 * like the prototype's body.branded/body.whitelabel classes.
 */
const AppliancePreview = ({ quoteData, totals }) => {
  const { client, meta, discountPct } = quoteData;
  const rows = totals?.rows || quoteData.items;
  const showDiscCol = Number(discountPct) > 0;
  const branded = !!quoteData.branded;

  return (
    <div className={`appliance-preview ${branded ? 'branded' : 'whitelabel'}`}>
      <div className="ap-page">
        <div className="ap-hdr">
          <div className="ap-brand-block">
            {branded && <div className="ap-logo-mark">D</div>}
            <div>
              <div className="ap-co-name">Noma Atellier, S.L.</div>
              <div className="ap-co-sub">
                NIF/CIF B22620520
                <br />
                C. Juan Antonio de Torquemada, Local B9-2, San Pedro Alcántara, Málaga 29670
                <br />
                BBVA IBAN: ES66 0182 3028 5102 0176 1945
              </div>
            </div>
          </div>
          <div className="ap-doc-block">
            <div className="ap-doc-title">Quotation</div>
            <div className="ap-doc-meta">
              Date: {meta.date}
              <br />
              Quote No.: {meta.quoteNo}
              <br />
              Valid until: {meta.validUntil}
            </div>
          </div>
        </div>

        <div className="ap-info-row">
          <div>
            <div className="ap-info-label">Client</div>
            <div className="ap-info-field"><span className="ap-info-field-label">Name</span><span className="ap-info-field-val">{client.name}</span></div>
            <div className="ap-info-field"><span className="ap-info-field-label">Project</span><span className="ap-info-field-val">{client.project}</span></div>
            <div className="ap-info-field"><span className="ap-info-field-label">Address</span><span className="ap-info-field-val">{client.address}</span></div>
          </div>
          <div>
            <div className="ap-info-label">Contact</div>
            <div className="ap-info-field"><span className="ap-info-field-label">Email</span><span className="ap-info-field-val">{client.email}</span></div>
            <div className="ap-info-field"><span className="ap-info-field-label">Phone</span><span className="ap-info-field-val">{client.phone}</span></div>
            <div className="ap-info-field"><span className="ap-info-field-label">Prepared by</span><span className="ap-info-field-val">{client.preparedBy}</span></div>
          </div>
        </div>

        <table className="ap-table">
          <thead>
            <tr>
              <th className="tc" style={{ width: 28 }}>#</th>
              <th className="tc" style={{ width: 34 }}>Qty</th>
              <th className="tl" style={{ width: 94 }}>Item No.</th>
              <th className="tl">Description</th>
              <th className="num">List Price</th>
              {showDiscCol && <th className="num" style={{ width: 46 }}>Disc.</th>}
              <th className="num">Net Unit</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={item.id ?? idx}>
                <td className="c n">{idx + 1}</td>
                <td className="c">{item.qty}</td>
                <td className="n" style={{ fontSize: '8pt' }}>{item.matNo}</td>
                <td>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="ap-desc-link">{item.desc}</a>
                  ) : (
                    item.desc
                  )}
                </td>
                <td className="r">{item.listPrice > 0 ? euro(item.listPrice) : ''}</td>
                {showDiscCol && <td className="c n">{Number(discountPct) > 0 ? `${discountPct}%` : ''}</td>}
                <td className="r n">{item.listPrice > 0 ? euro(item.net) : ''}</td>
                <td className="r bold">{item.lineTotal > 0 ? euro(item.lineTotal) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ap-totals">
          <div className="ap-t-row"><span className="tl">Subtotal (excl. VAT)</span><span className="tv">{euro(totals?.subtotal)}</span></div>
          <div className="ap-t-row"><span className="tl">VAT 21%</span><span className="tv">{euro(totals?.vat)}</span></div>
          <div className="ap-t-row ap-grand"><span className="tl">Total incl. VAT</span><span className="tv">€ {euro(totals?.grand)}</span></div>
        </div>

        <div className="ap-footer">
          Prices subject to availability and confirmation · Quote valid for 30 days from date of issue
        </div>
      </div>
    </div>
  );
};

export default AppliancePreview;
