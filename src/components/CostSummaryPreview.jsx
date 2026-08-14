import SplitLogo from './SplitLogo';
import '../styles/CostSummaryPreview.css';

const euro = (n) =>
  Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/**
 * CostSummaryPreview — shared print preview for quote_type 'flooring' and
 * 'windows'. Two pages, ported from the real reference PDFs (a full-bleed
 * cover photo with the Domberg mark + "Commercial Offer", then a plain
 * "Summary Cost Table" page): one description/surface/price-per-m²/total
 * line, a material/system spec line, includes/excludes bullets, and
 * (flooring only) an installation-areas list. No VAT/IVA line anywhere —
 * IVA appears only inside the excludes bullets, matching the source PDFs.
 */
const CostSummaryPreview = ({ quoteData, totals, variant }) => {
  const isFlooring = variant === 'flooring';
  const { client, surfaceM2, includes, excludes, coverImage } = quoteData;
  const showPricePerM2 = quoteData.showPricePerM2 !== false && (isFlooring || totals?.auto);
  const pricePerM2 = quoteData.pricePerM2;

  return (
    <div className="cost-summary-preview">
      {/* ============================== COVER ============================== */}
      <div className="cs-cover">
        {coverImage ? (
          <img className="cs-cover-img" src={coverImage} alt="" />
        ) : (
          <div className="cs-cover-placeholder">
            <svg width="60" height="52" viewBox="0 0 60 52" fill="none">
              <rect x="2" y="2" width="56" height="44" rx="3" stroke="#999" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="6" stroke="#999" strokeWidth="1.5" />
              <path d="M2 38 L16 24 L28 34 L40 22 L58 40" stroke="#999" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p>Cover image</p>
          </div>
        )}
        <div className="cs-cover-panel">
          <SplitLogo size={230} />
          <div className="cs-cover-body">
            <div className="cs-cover-eyebrow">{isFlooring ? 'Hardwood & Flooring' : 'Windows & Structures'}</div>
            <div className="cs-cover-rule" />
            <div className="cs-cover-title">
              Commercial
              <br />
              Offer
            </div>
          </div>
          <div className="cs-cover-bottom">
            {client?.project && <div className="cs-cover-client">{client.project}</div>}
            <a className="cs-cover-url" href="https://domberg.es" target="_blank" rel="noreferrer">
              www.domberg.es
            </a>
          </div>
        </div>
      </div>

      {/* ============================== SUMMARY ============================== */}
      <div className="cs-page">
        <h2 className="cs-summary-title">Summary Cost Table</h2>

        <table className="cs-table">
          <thead>
            <tr>
              <th className="tl">Description</th>
              <th>Surface, m2</th>
              {showPricePerM2 && <th>Price/m2</th>}
              <th>Total EUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="tl bold">{isFlooring ? 'Cost of flooring' : 'Cost of structures'}</td>
              <td className="bold">{Number(surfaceM2 || 0).toLocaleString('en-GB')}</td>
              {showPricePerM2 && <td className="bold">{pricePerM2 ? euro(pricePerM2) : ''}</td>}
              <td className="bold">{euro(totals?.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="cs-material-line">{isFlooring ? quoteData.material : quoteData.system}</div>

        <div className="cs-copy-grid">
          <div className="cs-copy-col">
            <h4>The cost includes:</h4>
            <ul>
              {(includes || []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="cs-copy-col">
            <h4>The cost does not include:</h4>
            <ul>
              {(excludes || []).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        {isFlooring && (quoteData.installAreas || []).length > 0 && (
          <div className="cs-areas">
            <h4>Installation in the following areas:</h4>
            <ul>
              {quoteData.installAreas.map((area, i) => (
                <li key={i}>{area}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="cs-footer">
          <SplitLogo size={90} />
          <div className="cs-footer-contact">
            <a href="https://domberg.es" target="_blank" rel="noreferrer">domberg.es</a>
            <br />
            San Pedro de Alcántara
            <br />
            Marbella, Málaga, España
            <br />
            <a href="mailto:sales@domberg.es">sales@domberg.es</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostSummaryPreview;
