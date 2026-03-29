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

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        photo_url: form.photo_url || `https://i.pravatar.cc/400?u=${user.email}`,
        allowance_expectation: parseInt(form.allowance_expectation) || 0,
      };
      const updated = await api.put('/profiles/me', payload);
      updateUser(updated);
      navigate('/discover');
    } catch (err) {
      setError(err.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // Step 0: basics
    <div key="basics" className="space-y-4">
      <h2 className="text-2xl font-black text-slate-800">About you</h2>
      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
        required
      />
      <input
        type="number"
        placeholder="Age"
        value={form.age}
        onChange={e => set('age', e.target.value)}
        min={18} max={100}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
        required
      />
      <textarea
        placeholder="Write a short bio..."
        value={form.bio}
        onChange={e => set('bio', e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
      />
      <input
        type="url"
        placeholder="Photo URL (optional)"
        value={form.photo_url}
        onChange={e => set('photo_url', e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
      />
    </div>,

    // Step 1: gender & preference
    <div key="gender" className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800">I am a...</h2>
      <div className="grid grid-cols-3 gap-3">
        {[['man','Man','🧔'],['woman','Woman','👩'],['nonbinary','Nonbinary','🌈']].map(([v, l, e]) => (
          <button
            key={v}
            type="button"
            onClick={() => set('gender', v)}
            className={`py-4 rounded-2xl border-2 font-semibold transition-all flex flex-col items-center gap-1 ${
              form.gender === v
                ? 'border-rose-500 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'
            }`}
          >
            <span className="text-2xl">{e}</span>
            <span className="text-sm">{l}</span>
          </button>
        ))}
      </div>
      <h2 className="text-2xl font-black text-slate-800">Interested in...</h2>
      <div className="grid grid-cols-3 gap-3">
        {[['men','Men','👨'],['women','Women','👩'],['everyone','Everyone','💫']].map(([v, l, e]) => (
          <button
            key={v}
            type="button"
            onClick={() => set('interested_in', v)}
            className={`py-4 rounded-2xl border-2 font-semibold transition-all flex flex-col items-center gap-1 ${
              form.interested_in === v
                ? 'border-rose-500 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'
            }`}
          >
            <span className="text-2xl">{e}</span>
            <span className="text-sm">{l}</span>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: profile type
    <div key="type" className="space-y-4">
      <h2 className="text-2xl font-black text-slate-800">Profile type</h2>
      <p className="text-slate-500 text-sm">This helps others know what you're looking for</p>
      <div className="space-y-3">
        {PROFILE_TYPES.map(({ value, label, emoji, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => set('profile_type', value)}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
              form.profile_type === value
                ? 'border-rose-500 bg-rose-50'
                : 'border-slate-200 bg-white hover:border-rose-300'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="font-semibold text-slate-800">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </button>
        ))}
      </div>
      {form.profile_type === 'sugar_baby' && (
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Monthly allowance expectation ($)</label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={form.allowance_expectation}
            onChange={e => set('allowance_expectation', e.target.value)}
            min={0}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-purple-50">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-rose-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {steps[step]}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canNext[step]}
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-lg disabled:opacity-40 hover:shadow-xl transition-all"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-lg disabled:opacity-60 hover:shadow-xl transition-all"
            >
              {loading ? 'Saving...' : "Let's Go!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
