import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const PROFILE_TYPES = [
  { value: 'regular',      label: 'Regular',       emoji: '😊', desc: 'Just looking for connection' },
  { value: 'sugar_daddy',  label: 'Sugar Daddy',   emoji: '💎', desc: 'Generous & established' },
  { value: 'sugar_mommy',  label: 'Sugar Mommy',   emoji: '👑', desc: 'Successful & giving' },
  { value: 'sugar_baby',   label: 'Sugar Baby',    emoji: '🍭', desc: 'Looking for an arrangement' },
];

export function SetupProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: user?.name || '',
    age: '',
    bio: '',
    gender: '',
    interested_in: '',
    photo_url: '',
    profile_type: 'regular',
    allowance_expectation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const updated = await api.put('/profiles/me', {
        ...form,
        age: parseInt(form.age),
        photo_url: form.photo_url || `https://i.pravatar.cc/400?u=${user.email}`,
        allowance_expectation: parseInt(form.allowance_expectation) || 0,
      });
      updateUser(updated);
      navigate('/discover');
    } catch (err) {
      setError(err.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  const optionClass = (active) => ({
    border: '2px solid',
    borderColor: active ? 'var(--skin-accent)' : 'var(--skin-border)',
    background: active ? 'rgba(244,63,94,0.08)' : 'var(--skin-fill)',
    color: active ? 'var(--skin-accent)' : 'var(--skin-text)',
  });

  const steps = [
    <div key="basics" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>About you</h2>
      <input type="text" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)}
        className="input-base w-full px-4 py-3 rounded-2xl border transition" required />
      <input type="number" placeholder="Age" value={form.age} onChange={e => set('age', e.target.value)}
        min={18} max={100}
        className="input-base w-full px-4 py-3 rounded-2xl border transition" required />
      <textarea placeholder="Write a short bio…" value={form.bio} onChange={e => set('bio', e.target.value)}
        rows={3}
        className="input-base w-full px-4 py-3 rounded-2xl border transition resize-none" />
      <input type="url" placeholder="Photo URL (optional)" value={form.photo_url} onChange={e => set('photo_url', e.target.value)}
        className="input-base w-full px-4 py-3 rounded-2xl border transition" />
    </div>,

    <div key="gender" className="space-y-6">
      <h2 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>I am a…</h2>
      <div className="grid grid-cols-3 gap-3">
        {[['man','Man','🧔'],['woman','Woman','👩'],['nonbinary','Nonbinary','🌈']].map(([v,l,e]) => (
          <button key={v} type="button" onClick={() => set('gender', v)}
            className="py-4 rounded-2xl font-semibold transition-all flex flex-col items-center gap-1"
            style={optionClass(form.gender === v)}>
            <span className="text-2xl">{e}</span>
            <span className="text-sm">{l}</span>
          </button>
        ))}
      </div>
      <h2 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>Interested in…</h2>
      <div className="grid grid-cols-3 gap-3">
        {[['men','Men','👨'],['women','Women','👩'],['everyone','Everyone','💫']].map(([v,l,e]) => (
          <button key={v} type="button" onClick={() => set('interested_in', v)}
            className="py-4 rounded-2xl font-semibold transition-all flex flex-col items-center gap-1"
            style={optionClass(form.interested_in === v)}>
            <span className="text-2xl">{e}</span>
            <span className="text-sm">{l}</span>
          </button>
        ))}
      </div>
    </div>,

    <div key="type" className="space-y-4">
      <h2 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>Profile type</h2>
      <p className="text-sm" style={{ color: 'var(--skin-muted)' }}>This helps others know what you're looking for</p>
      <div className="space-y-3">
        {PROFILE_TYPES.map(({ value, label, emoji, desc }) => (
          <button key={value} type="button" onClick={() => set('profile_type', value)}
            className="w-full px-4 py-3 rounded-2xl text-left transition-all flex items-center gap-3"
            style={optionClass(form.profile_type === value)}>
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="font-semibold">{label}</div>
              <div className="text-xs opacity-70">{desc}</div>
            </div>
          </button>
        ))}
      </div>
      {form.profile_type === 'sugar_baby' && (
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--skin-muted)' }}>
            Monthly allowance expectation ($)
          </label>
          <input type="number" placeholder="e.g. 500" value={form.allowance_expectation}
            onChange={e => set('allowance_expectation', e.target.value)} min={0}
            className="input-base w-full px-4 py-3 rounded-2xl border transition" />
        </div>
      )}
    </div>,
  ];

  const canNext = [
    form.name && form.age >= 18,
    form.gender && form.interested_in,
    true,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-gradient">
      <div className="w-full max-w-sm">
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? 'var(--skin-accent)' : 'var(--skin-border)' }} />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {steps[step]}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 py-3 rounded-2xl">
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button type="button" disabled={!canNext[step]} onClick={() => setStep(s => s + 1)}
              className="btn-primary flex-1 py-3 rounded-2xl disabled:opacity-40">
              Next
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={handleSubmit}
              className="btn-primary flex-1 py-3 rounded-2xl">
              {loading ? 'Saving…' : "Let's Go! 🎉"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
