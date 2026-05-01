import { useState, useEffect, useRef } from 'react';
import QuoteForm from './QuoteForm';
import QuotePreview from './QuotePreview';
import { defaultQuoteData } from '../lib/defaultQuote';
import '../styles/QuoteGenerator.css';

const QuoteGenerator = () => {
  const [quoteData, setQuoteData] = useState(defaultQuoteData);
  const [savedAt, setSavedAt] = useState(null);
  const fileInputRef = useRef(null);

  // -------------------- Totals --------------------
  const subtotal = quoteData.items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
    0
  );
  const iva = subtotal * (Number(quoteData.vatRate) || 0) / 100;
  const total = subtotal + iva;
  const totals = { subtotal, iva, total };

  // -------------------- Autosave --------------------
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem('domberg_quote_autosave', JSON.stringify(quoteData));
        setSavedAt(new Date());
      } catch (e) {}
    }, 800);
    return () => clearTimeout(id);
  }, [quoteData]);

  useEffect(() => {
    const raw = localStorage.getItem('domberg_quote_autosave');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.items && parsed.cover) {
        if (
          parsed.cover.projectName !== defaultQuoteData.cover.projectName ||
          parsed.items.length !== defaultQuoteData.items.length
        ) {
          if (window.confirm('Restore your last unsaved draft?')) {
            setQuoteData({
              ...defaultQuoteData,
              ...parsed,
              aboutPage: { ...defaultQuoteData.aboutPage, ...(parsed.aboutPage || {}) },
              cover: { ...defaultQuoteData.cover, ...(parsed.cover || {}) },
              meta: { ...defaultQuoteData.meta, ...(parsed.meta || {}) },
            });
          }
        }
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------- Actions --------------------
  const handlePrint = () => window.print();

  const handleExport = () => {
    const json = JSON.stringify(quoteData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (quoteData.cover.projectName || 'quote')
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    a.href = url;
    a.download = `domberg-${safeName || 'quote'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let text = String(evt.target.result || '');
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        const data = JSON.parse(text.trim());
        if (typeof data !== 'object' || !data.items) {
          window.alert('That JSON does not look like a Domberg quote.');
          return;
        }
        if (window.confirm('Replace the current quote with the imported data?')) {
          setQuoteData({
            ...defaultQuoteData,
            ...data,
            aboutPage: { ...defaultQuoteData.aboutPage, ...(data.aboutPage || {}) },
            cover: { ...defaultQuoteData.cover, ...(data.cover || {}) },
            meta: { ...defaultQuoteData.meta, ...(data.meta || {}) },
          });
        }
      } catch (err) {
        window.alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleNewQuote = () => {
    if (window.confirm('Start a fresh quote? Unsaved changes will be lost.')) {
      setQuoteData(defaultQuoteData);
    }
  };

  const handleAddItem = () => {
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
    setQuoteData({ ...quoteData, items: [...quoteData.items, newItem] });
  };

  const toggleAboutPage = () => {
    setQuoteData({
      ...quoteData,
      aboutPage: {
        ...quoteData.aboutPage,
        enabled: !quoteData.aboutPage?.enabled,
      },
    });
  };

  const aboutEnabled = quoteData.aboutPage?.enabled ?? false;

  return (
    <div className="quote-generator">
      <div className="generator-toolbar">
        <span className="tb-brand">Domberg Quote Generator</span>
        <span className="tb-sep" />

        <button className="tb-btn" onClick={handleNewQuote} title="Start a fresh quote">
          New
        </button>
        <button className="tb-btn" onClick={handleAddItem} title="Add an item to the schedule">
          + Item
        </button>

        <span className="tb-sep" />

        <button
          className={`tb-btn${aboutEnabled ? ' tb-btn--on' : ''}`}
          onClick={toggleAboutPage}
          title="Show or hide the About Domberg page in the quote"
        >
          {aboutEnabled ? '✓ About Page' : 'About Page'}
        </button>

        <span className="tb-sep" />

        <button className="tb-btn" onClick={handleImportClick} title="Import a JSON quote">
          Import JSON
        </button>
        <button className="tb-btn" onClick={handleExport} title="Download as JSON">
          Export JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />

        <span className="tb-sep" />

        <button
          className="tb-btn tb-btn--primary"
          onClick={handlePrint}
          title="Print to PDF (Margins=None, Background graphics=ON)"
        >
          Print to PDF
        </button>

        <span className="tb-warn">
          Chrome print: Margins = None &amp; Background graphics = ON
        </span>

        {savedAt && (
          <span className="tb-saved">Saved {savedAt.toLocaleTimeString()}</span>
        )}
      </div>

      <div className="generator-container">
        <div className="form-panel">
          <QuoteForm quoteData={quoteData} onChange={setQuoteData} />
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <span>Live preview</span>
            <small>· edits appear instantly</small>
          </div>
          <div className="preview-content">
            <QuotePreview quoteData={quoteData} totals={totals} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteGenerator;
