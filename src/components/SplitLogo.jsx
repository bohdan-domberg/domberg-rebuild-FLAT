import '../styles/SplitLogo.css';

/**
 * Split Domberg logo: orange-tinted icon on top, dark wordmark below.
 * The orange tint comes from the `#logo-orange-tint` SVG color-matrix
 * filter defined once at the top level in App.jsx.
 */
const SplitLogo = ({ size = 200 }) => (
  <div className="logo-split" style={{ height: size, width: size }}>
    <img src="/domberg-logo.svg" className="logo-orange-top" alt="" />
    <img src="/domberg-logo.svg" className="logo-dark-bottom" alt="Domberg" />
  </div>
);

export default SplitLogo;
