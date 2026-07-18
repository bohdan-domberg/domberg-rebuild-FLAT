import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import QuoteGenerator from './components/QuoteGenerator';
import HistoryDashboard from './components/HistoryDashboard';
import './App.css';

/**
 * App — top-level shell.
 *
 * The hidden SVG `<filter>` is referenced by .logo-orange-top in QuotePreview.css
 * to convert the black logo's pixels to brand orange (#FE6024). Must live in the
 * DOM tree of the page that uses it, so it goes at the top level.
 */
function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const logoFilter = (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="logo-orange-tint" colorInterpolationFilters="sRGB">
          <feColorMatrix values="0 0 0 0 0.996  0 0 0 0 0.376  0 0 0 0 0.141  0 0 0 1 0" />
        </filter>
      </defs>
    </svg>
  );

  // Still checking for an existing session — avoid a login flash
  if (session === undefined) {
    return (
      <>
        {logoFilter}
        <div className="app" />
      </>
    );
  }

  if (!session) {
    return (
      <>
        {logoFilter}
        <Login />
      </>
    );
  }

  return (
    <>
      {logoFilter}
      <BrowserRouter>
        <div className="app">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<QuoteGenerator />} />
              <Route path="/history" element={<HistoryDashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
