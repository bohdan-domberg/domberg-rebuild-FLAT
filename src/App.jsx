import QuoteGenerator from './components/QuoteGenerator';
import './App.css';

/**
 * App — top-level shell.
 *
 * The hidden SVG `<filter>` is referenced by .logo-orange-top in QuotePreview.css
 * to convert the black logo's pixels to brand orange (#FE6024). Must live in the
 * DOM tree of the page that uses it, so it goes at the top level.
 */
function App() {
  return (
    <>
      {/* Global SVG filter for the split logo's orange top half */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id="logo-orange-tint"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix values="0 0 0 0 0.996  0 0 0 0 0.376  0 0 0 0 0.141  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      <div className="app">
        <main className="app-main">
          <QuoteGenerator />
        </main>
      </div>
    </>
  );
}

export default App;
