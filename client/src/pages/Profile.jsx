import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';

const PROFILE_TYPES = [
  { value: 'regular',     label: 'Regular',      emoji: '😊' },
  { value: 'sugar_daddy', label: 'Sugar Daddy',  emoji: '💎' },
  { value: 'sugar_mommy', label: 'Sugar Mommy',  emoji: '👑' },
  { value: 'sugar_baby',  label: 'Sugar Baby',   emoji: '🍭' },
];

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({ ...user });
  const [vacations, setVacations] = useState([]);
  const [newVac, setNewVac] = useState({ location: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [addingVac, setAddingVac] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('profile'); // profile | vacations

  useEffect(() => {
    api.get('/vacations').then(setVacations).catch(console.error);
  }, []);

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put('/profiles/me', {
        ...form,
        age: parseInt(form.age),
        allowance_expectation: parseInt(form.allowance_expectation) || 0,
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addVacation(e) {
    e.preventDefault();
    setAddingVac(true);
    try {
      const v = await api.post('/vacations', newVac);
      setVacations(prev => [...prev, v]);
      setNewVac({ location: '', start_date: '', end_date: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingVac(false);
    }
  }

  async function deleteVacation(id) {
    await api.del(`/vacations/${id}`);
    setVacations(prev => prev.filter(v => v.id !== id));
  }

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-slate-800">My Profile</h1>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-red-500 transition-colors font-medium">
          Sign out
        </button>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={user.photo_url || `https://i.pravatar.cc/80?u=${user.email}`}
          alt={user.name}
          className="w-20 h-20 rounded-full object-cover border-4 border-rose-200 shadow"
        />
        <div>
          <p className="text-xl font-bold text-slate-800">{user.name}, {user.age}</p>
          <RoleBadge type={user.profile_type} allowance={user.allowance_expectation} size="lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl">
        {['profile', 'vacations'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white shadow text-rose-500' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'vacations' ? `✈️ Vacations (${vacations.length})` : '👤 Profile'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Name</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Age</label>
            <input
              type="number"
              value={form.age || ''}
              onChange={e => set('age', e.target.value)}
              min={18}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Bio</label>
            <textarea
              value={form.bio || ''}
              onChange={e => set('bio', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Photo URL</label>
            <input
              type="url"
              value={form.photo_url || ''}
              onChange={e => set('photo_url', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Profile Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROFILE_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('profile_type', value)}
                  className={`py-3 rounded-2xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    form.profile_type === value
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {form.profile_type === 'sugar_baby' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Monthly Allowance Expectation ($)
              </label>
              <input
                type="number"
                value={form.allowance_expectation || ''}
                onChange={e => set('allowance_expectation', e.target.value)}
                min={0}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {tab === 'vacations' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Add your upcoming trips so people can find you when they're visiting the same places!
          </p>

          {/* Existing vacations */}
          {vacations.length > 0 && (
            <div className="space-y-2">
              {vacations.map(v => (
                <div key={v.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                  <span className="text-2xl">✈️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{v.location}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(v.start_date)} – {formatDate(v.end_date)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteVacation(v.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add vacation form */}
          <form onSubmit={addVacation} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-700">Add a Trip</h3>
            <input
              type="text"
              placeholder="Location (e.g. Paris, France)"
              value={newVac.location}
              onChange={e => setNewVac(v => ({ ...v, location: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">From</label>
                <input
                  type="date"
                  value={newVac.start_date}
                  onChange={e => setNewVac(v => ({ ...v, start_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">To</label>
                <input
                  type="date"
                  value={newVac.end_date}
                  onChange={e => setNewVac(v => ({ ...v, end_date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingVac}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm shadow hover:shadow-md transition-all disabled:opacity-60"
            >
              {addingVac ? 'Adding...' : '+ Add Trip'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
