import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <span className="login-brand">DOMBERG</span>
        <h1>Quote Generator</h1>

        {sent ? (
          <p className="login-sent">
            Check <strong>{email}</strong> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domberg.es"
                required
                autoFocus
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
