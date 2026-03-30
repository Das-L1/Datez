import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/login', form);
      login(token, user);
      navigate('/discover');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-gradient">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-2">💘</div>
        <h1 className="text-4xl font-black heading-gradient">Datez</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--skin-muted)' }}>Find your connection</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="input-base w-full px-4 py-3 rounded-2xl border transition"
          required />
        <input type="password" placeholder="Password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="input-base w-full px-4 py-3 rounded-2xl border transition"
          required />

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3 rounded-2xl text-lg">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <button type="button" onClick={() => setForm({ email: 'demo@datez.com', password: 'password' })}
          className="btn-secondary w-full py-2 rounded-2xl text-sm border"
          style={{ borderColor: 'var(--skin-border)' }}>
          Use demo account
        </button>

        <p className="text-center text-sm" style={{ color: 'var(--skin-muted)' }}>
          No account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--skin-accent)' }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
