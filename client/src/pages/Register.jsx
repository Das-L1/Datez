import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/register', form);
      login(token, user);
      navigate('/setup');
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
        <h1 className="text-4xl font-black heading-gradient">Join Datez</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--skin-muted)' }}>Find your connection</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <input type="text" placeholder="Your name" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="input-base w-full px-4 py-3 rounded-2xl border transition"
          required />
        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="input-base w-full px-4 py-3 rounded-2xl border transition"
          required />
        <input type="password" placeholder="Password (min 6 chars)" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="input-base w-full px-4 py-3 rounded-2xl border transition"
          minLength={6} required />

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3 rounded-2xl text-lg">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-sm" style={{ color: 'var(--skin-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--skin-accent)' }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
