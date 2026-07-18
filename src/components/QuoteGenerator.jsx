import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuoteForm from './QuoteForm';
import QuotePreview from './QuotePreview';
import { defaultQuoteData } from '../lib/defaultQuote';
import { supabase } from '../lib/supabaseClient';
import { saveQuote, loadQuote, getNextQuoteReference } from '../lib/quotesApi';
import '../styles/QuoteGenerator.css';

const QuoteGenerator = () => {
  const [quoteData, setQuoteData] = useState(defaultQuoteData);
  const [savedAt, setSavedAt] = useState(null);
  const [quoteId, setQuoteId] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle | saving | saved | offline | error
  const [loadingCloud, setLoadingCloud] = useState(false);
  const fileInputRef = useRef(null);
  const extractorFileInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasLoadedFromUrl = useRef(false);

  // -------------------- Load a specific quote from the cloud (?quote=id) --------------------
  useEffect(() => {
    const idFromUrl = searchParams.get('quote');
    if (!idFromUrl || hasLoadedFromUrl.current) return;
    hasLoadedFromUrl.current = true;
    setLoadingCloud(true);
    loadQuote(idFromUrl)
      .then((row) => {
        setQuoteData({
          ...defaultQuoteData,
          ...row.data,
          aboutPage: { ...defaultQuoteData.aboutPage, ...(row.data?.aboutPage || {}) },
          pricing: { ...defaultQuoteData.pricing, ...(row.data?.pricing || {}) },
          cover: { ...defaultQuoteData.cover, ...(row.data?.cover || {}) },
          meta: { ...defaultQuoteData.meta, ...(row.data?.meta || {}) },
        });
        setQuoteId(row.id);
      })
      .catch((err) => window.alert(`Could not load that quote: ${err.message}`))
      .finally(() => setLoadingCloud(false));
  }, [searchParams]);

  // -------------------- Totals --------------------
  const rawSubtotal = quoteData.items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1),
    0
  );

  const pricing = quoteData.pricing || defaultQuoteData.pricing;
  const discountAmount = pricing.discountEnabled
    ? pricing.discountType === 'percent'
      ? (rawSubtotal * (Number(pricing.discountValue) || 0)) / 100
      : Number(pricing.discountValue) || 0
    : 0;
  const computedSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const computedIva = computedSubtotal * (Number(quoteData.vatRate) || 0) / 100;
  const computedTotal = computedSubtotal + computedIva;

  const subtotal =
    pricing.manualOverride && pricing.manualSubtotal !== null && pricing.manualSubtotal !== ''
      ? Number(pricing.manualSubtotal)
      : computedSubtotal;
  const iva =
    pricing.manualOverride && pricing.manualIva !== null && pricing.manualIva !== ''
      ? Number(pricing.manualIva)
      : computedIva;
  const total =
    pricing.manualOverride && pricing.manualTotal !== null && pricing.manualTotal !== ''
      ? Number(pricing.manualTotal)
      : computedTotal;
  const totals = {
    rawSubtotal,
    discountAmount: pricing.manualOverride ? 0 : discountAmount,
    discountLabel: pricing.discountLabel || 'Discount',
    subtotal,
    iva,
    total,
    vatEnabled: pricing.vatEnabled !== false,
  };

  // -------------------- Autosave --------------------
  // Always writes to localStorage immediately (instant, never blocked by network),
  // then mirrors up to Supabase on the same debounce. If Supabase fails (offline,
  // connection hiccup), the local copy is still safe and we just flag "offline" —
  // nothing blocks editing.
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        localStorage.setItem('domberg_quote_autosave', JSON.stringify(quoteData));
        localStorage.setItem('domberg_quote_autosave_id', quoteId || '');
        setSavedAt(new Date());
      } catch (e) {
        // ignore
      }

      setCloudStatus('saving');
      try {
        const savedId = await saveQuote({ id: quoteId, quoteData });
        if (!quoteId) setQuoteId(savedId);
        setCloudStatus('saved');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Cloud save failed, staying local-only:', e.message);
        setCloudStatus('offline');
      }
    }, 800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteData]);

  useEffect(() => {
    if (searchParams.get('quote')) return; // loading a specific cloud quote instead
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
              pricing: { ...defaultQuoteData.pricing, ...(parsed.pricing || {}) },
              cover: { ...defaultQuoteData.cover, ...(parsed.cover || {}) },
              meta: { ...defaultQuoteData.meta, ...(parsed.meta || {}) },
            });
            const savedId = localStorage.getItem('domberg_quote_autosave_id');
            if (savedId) setQuoteId(savedId);
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
            pricing: { ...defaultQuoteData.pricing, ...(data.pricing || {}) },
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

  // -------------------- Import items from the quote-extractor JSON --------------------
  // Unlike "Import JSON" (which replaces the whole quote), this ADDS items to the
  // current schedule — matches the extractor skill's output of {items:[{name, sub, specs}]}.
  // Price/qty/images are left at defaults since the extractor deliberately doesn't
  // touch pricing or photos — you fill price/qty and drop in photos afterward.
  const handleImportExtractorClick = () => extractorFileInputRef.current?.click();

  const handleImportExtractorFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let text = String(evt.target.result || '');
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        const data = JSON.parse(text.trim());
        const incoming = Array.isArray(data) ? data : data.items;
        if (!Array.isArray(incoming) || incoming.length === 0) {
          window.alert('That JSON does not look like extractor output (expected an "items" array).');
          return;
        }
        const newItems = incoming.map((it, i) => ({
          id: Date.now() + i,
          name: it.name || 'New Item',
          sub: it.sub || '',
          specs:
            Array.isArray(it.specs) && it.specs.length
              ? it.specs
              : [
                  { label: 'Dimensions', value: '' },
                  { label: 'Materials', value: '' },
                  { label: 'Hardware', value: '' },
                ],
          price: Number(it.price) || 0,
          qty: 1,
          images: { main: null, detail1: null, detail2: null },
        }));
        if (
          window.confirm(
            `Add ${newItems.length} item${newItems.length === 1 ? '' : 's'} from the extractor to this quote? (Quantities and photos are left blank — fill those in after. Prices are pre-filled — double-check them against the factory quote before sending.)`
          )
        ) {
          setQuoteData({ ...quoteData, items: [...quoteData.items, ...newItems] });
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
      setQuoteId(null);
      navigate('/');
      getNextQuoteReference().then((ref) => {
        setQuoteData((prev) => ({
          ...prev,
          meta: { ...prev.meta, reference: ref },
        }));
      });
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

  // -------------------- Missing-info check (persistent bottom-left status) --------------------
  const itemsMissingPrice = quoteData.items.filter((i) => !Number(i.price)).length;
  const itemsMissingImages = quoteData.items.filter(
    (i) => !i.images || (!i.images.main && !i.images.detail1 && !i.images.detail2)
  ).length;
  const warnings = [];
  if (itemsMissingPrice > 0) {
    warnings.push(`${itemsMissingPrice} item${itemsMissingPrice === 1 ? '' : 's'} missing price`);
  }
  if (itemsMissingImages > 0) {
    warnings.push(`${itemsMissingImages} item${itemsMissingImages === 1 ? '' : 's'} missing photos`);
  }

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
        <button className="tb-btn" onClick={() => navigate('/history')} title="Browse saved quotes">
          History
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

        <button
          className="tb-btn"
          onClick={handleImportExtractorClick}
          title="Drop in the JSON from the quote-extractor skill to add items"
        >
          Import Items (Extractor)
        </button>
        <input
          ref={extractorFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportExtractorFile}
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

        {cloudStatus === 'saving' && <span className="tb-saved">Syncing…</span>}
        {cloudStatus === 'saved' && savedAt && (
          <span className="tb-saved">✓ Saved to cloud {savedAt.toLocaleTimeString()}</span>
        )}
        {cloudStatus === 'offline' && (
          <span className="tb-saved tb-saved--offline" title="Saved on this device only — will sync once back online">
            Saved locally (offline)
          </span>
        )}
        {loadingCloud && <span className="tb-saved">Loading quote…</span>}

        <span className="tb-sep" />
        <button
          className="tb-btn"
          onClick={() => supabase.auth.signOut()}
          title="Sign out"
        >
          Log out
        </button>
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

      {warnings.length > 0 && (
        <div className="status-bar status-bar--warning">
          ⚠ {warnings.join(' · ')}
        </div>
      )}
    </div>
  );
};

export default QuoteGenerator;
