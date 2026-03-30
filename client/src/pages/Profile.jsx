import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';
import { useSpicy, KINK_GROUPS } from '../context/SpicyContext';
import { SpicyUnlockModal } from '../components/SpicyUnlockModal';

const PROFILE_TYPES = [
  { value: 'regular',     label: 'Regular',      emoji: '😊' },
  { value: 'sugar_daddy', label: 'Sugar Daddy',  emoji: '💎' },
  { value: 'sugar_mommy', label: 'Sugar Mommy',  emoji: '👑' },
  { value: 'sugar_baby',  label: 'Sugar Baby',   emoji: '🍭' },
];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function KinksPanel({ myKinks, toggleKink, spicyMode, spicyUnlocked, onUnlock }) {
  const [open, setOpen] = useState({});

  function toggleGroup(id) {
    setOpen(o => ({ ...o, [id]: !o[id] }));
  }

  const totalSelected = myKinks.length;

  return (
    <div className="space-y-3">
      {/* Header info */}
      <div className="rounded-2xl p-4 border" style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--skin-text)' }}>🌶️ Your Private Preferences</p>
        <p className="text-xs" style={{ color: 'var(--skin-muted)' }}>
          Only visible to users with Spicy Mode active. Tap a category to expand, then pick what you're into.
        </p>
        {totalSelected > 0 && (
          <p className="text-xs font-semibold mt-2" style={{ color: 'var(--skin-accent)' }}>
            {totalSelected} selected · saved automatically
          </p>
        )}
      </div>

      {/* Category collapse cards */}
      {KINK_GROUPS.map(group => {
        const groupSelected = group.kinks.filter(k => myKinks.includes(k));
        const isOpen = !!open[group.id];

        return (
          <div key={group.id} className="rounded-2xl border overflow-hidden"
            style={{ borderColor: groupSelected.length > 0 ? 'var(--skin-accent)' : 'var(--skin-border)', background: 'var(--skin-fill)' }}>

            {/* Collapse header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left transition-opacity hover:opacity-80"
            >
              <span className="text-xl">{group.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm" style={{ color: 'var(--skin-text)' }}>
                  {group.label}
                </span>
                {groupSelected.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: spicyMode ? 'rgba(127,29,29,0.6)' : 'rgba(244,63,94,0.15)', color: 'var(--skin-accent)' }}>
                    {groupSelected.length}/{group.kinks.length}
                  </span>
                )}
              </div>
              {/* Selected pills preview when collapsed */}
              {!isOpen && groupSelected.length > 0 && (
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[140px] overflow-hidden">
                  {groupSelected.slice(0, 2).map(k => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-[68px]"
                      style={{ background: spicyMode ? 'rgba(127,29,29,0.5)' : 'rgba(244,63,94,0.12)', color: 'var(--skin-accent)' }}>
                      {k}
                    </span>
                  ))}
                  {groupSelected.length > 2 && (
                    <span className="text-xs" style={{ color: 'var(--skin-muted)' }}>+{groupSelected.length - 2}</span>
                  )}
                </div>
              )}
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="w-4 h-4 flex-shrink-0 transition-transform"
                style={{ color: 'var(--skin-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Kink pills */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t flex flex-wrap gap-2"
                style={{ borderColor: 'var(--skin-border)' }}>
                {group.kinks.map(k => {
                  const active = myKinks.includes(k);
                  return (
                    <button key={k} type="button" onClick={() => toggleKink(k)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                      style={{
                        borderColor: active ? 'var(--skin-accent)' : 'var(--skin-border)',
                        background: active
                          ? spicyMode ? 'rgba(127,29,29,0.55)' : 'rgba(244,63,94,0.13)'
                          : 'var(--skin-fill-2)',
                        color: active ? 'var(--skin-accent)' : 'var(--skin-muted)',
                        fontWeight: active ? 600 : 400,
                      }}>
                      {active ? '🌶️ ' : ''}{k}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Unlock nudge for non-spicy users */}
      {!spicyUnlocked && (
        <div className="rounded-2xl p-4 border text-center"
          style={{ background: 'rgba(127,29,29,0.12)', borderColor: 'rgba(127,29,29,0.35)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#fca5a5' }}>
            🌶️ Unlock Spicy Mode to see others' kinks in discovery
          </p>
          <button onClick={onUnlock} className="btn-primary px-6 py-2 rounded-xl text-sm">
            Unlock Spicy Mode
          </button>
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { spicyMode, spicyUnlocked, spicyLikes } = useSpicy();
  const [form, setForm] = useState({ ...user });
  const [myKinks, setMyKinks] = useState(user?.kinks || []);
  const [vacations, setVacations] = useState([]);
  const [newVac, setNewVac] = useState({ location: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [addingVac, setAddingVac] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('profile');
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    api.get('/vacations').then(setVacations).catch(console.error);
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put('/profiles/me', {
        ...form,
        age: parseInt(form.age),
        allowance_expectation: parseInt(form.allowance_expectation) || 0,
        kinks: myKinks,
      });
      updateUser({ ...updated, kinks: myKinks });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  async function saveKinks(kinks) {
    setMyKinks(kinks);
    await api.put('/profiles/me/kinks', { kinks });
  }

  function toggleKink(k) {
    const updated = myKinks.includes(k) ? myKinks.filter(x => x !== k) : [...myKinks, k];
    saveKinks(updated);
  }

  async function addVacation(e) {
    e.preventDefault();
    setAddingVac(true);
    try {
      const v = await api.post('/vacations', newVac);
      setVacations(prev => [...prev, v]);
      setNewVac({ location: '', start_date: '', end_date: '' });
    } catch (err) { alert(err.message); } finally { setAddingVac(false); }
  }

  const tabs = ['profile', 'kinks', 'vacations'];

  return (
    <div className="px-4 pt-4 pb-4" style={{ background: 'var(--skin-bg)', minHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>My Profile</h1>
        <button onClick={logout} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--skin-muted)' }}>
          Sign out
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <img src={user.photo_url || `https://i.pravatar.cc/80?u=${user.email}`} alt={user.name}
          className="w-20 h-20 rounded-full object-cover border-4 shadow"
          style={{ borderColor: 'var(--skin-accent)' }} />
        <div>
          <p className="text-xl font-bold" style={{ color: 'var(--skin-text)' }}>{user.name}, {user.age}</p>
          <RoleBadge type={user.profile_type} allowance={user.allowance_expectation} size="lg" />
          {spicyUnlocked && (
            <p className="text-xs mt-1" style={{ color: 'var(--skin-accent)' }}>
              🌶️ Spicy Mode · {spicyLikes} likes left
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: 'var(--skin-fill-2)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors`}
            style={{
              background: tab === t ? 'var(--skin-fill)' : 'transparent',
              color: tab === t ? 'var(--skin-accent)' : 'var(--skin-muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t === 'kinks' ? '🌶️ Kinks' : t === 'vacations' ? `✈️ Trips (${vacations.length})` : '👤 Profile'}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-4">
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Age', key: 'age', type: 'number' },
            { label: 'Photo URL', key: 'photo_url', type: 'url' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--skin-muted)' }}>{label}</label>
              <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                className="input-base w-full px-4 py-3 rounded-2xl border transition" />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--skin-muted)' }}>Bio</label>
            <textarea value={form.bio || ''} onChange={e => set('bio', e.target.value)} rows={3}
              className="input-base w-full px-4 py-3 rounded-2xl border transition resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: 'var(--skin-muted)' }}>Profile Type</label>
            <div className="grid grid-cols-2 gap-2">
              {PROFILE_TYPES.map(({ value, label, emoji }) => (
                <button key={value} type="button" onClick={() => set('profile_type', value)}
                  className="py-3 rounded-2xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    borderColor: form.profile_type === value ? 'var(--skin-accent)' : 'var(--skin-border)',
                    background: form.profile_type === value ? 'rgba(var(--skin-accent-rgb, 244,63,94),0.08)' : 'var(--skin-fill)',
                    color: form.profile_type === value ? 'var(--skin-accent)' : 'var(--skin-text)',
                  }}>
                  <span>{emoji}</span><span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {form.profile_type === 'sugar_baby' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: 'var(--skin-muted)' }}>
                Monthly Allowance Expectation ($)
              </label>
              <input type="number" value={form.allowance_expectation || ''} onChange={e => set('allowance_expectation', e.target.value)} min={0}
                className="input-base w-full px-4 py-3 rounded-2xl border transition" />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 rounded-2xl">
            {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      )}

      {/* Kinks tab */}
      {tab === 'kinks' && (
        <KinksPanel
          myKinks={myKinks}
          toggleKink={toggleKink}
          spicyMode={spicyMode}
          spicyUnlocked={spicyUnlocked}
          onUnlock={() => setShowUnlock(true)}
        />
      )}

      {/* Vacations tab */}
      {tab === 'vacations' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--skin-muted)' }}>
            Add upcoming trips so people can find you at the same destination!
          </p>

          {vacations.length > 0 && (
            <div className="space-y-2">
              {vacations.map(v => (
                <div key={v.id} className="rounded-2xl p-4 border flex items-center gap-3 surface"
                  style={{ borderColor: 'var(--skin-border)' }}>
                  <span className="text-2xl">✈️</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--skin-text)' }}>{v.location}</p>
                    <p className="text-xs" style={{ color: 'var(--skin-muted)' }}>{fmtDate(v.start_date)} – {fmtDate(v.end_date)}</p>
                  </div>
                  <button onClick={async () => { await api.del(`/vacations/${v.id}`); setVacations(p => p.filter(x => x.id !== v.id)); }}
                    className="text-lg font-bold hover:opacity-70 transition-opacity" style={{ color: 'var(--skin-muted)' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={addVacation} className="rounded-2xl p-4 border space-y-3"
            style={{ background: 'var(--skin-fill-2)', borderColor: 'var(--skin-border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--skin-text)' }}>Add a Trip</h3>
            <input type="text" placeholder="Location (e.g. Paris, France)" value={newVac.location}
              onChange={e => setNewVac(v => ({ ...v, location: e.target.value }))}
              className="input-base w-full px-4 py-2.5 rounded-xl border text-sm" required />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--skin-muted)' }}>From</label>
                <input type="date" value={newVac.start_date} onChange={e => setNewVac(v => ({ ...v, start_date: e.target.value }))}
                  className="input-base w-full px-3 py-2 rounded-xl border text-sm" required />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--skin-muted)' }}>To</label>
                <input type="date" value={newVac.end_date} onChange={e => setNewVac(v => ({ ...v, end_date: e.target.value }))}
                  className="input-base w-full px-3 py-2 rounded-xl border text-sm" required />
              </div>
            </div>
            <button type="submit" disabled={addingVac} className="btn-primary w-full py-2.5 rounded-xl text-sm">
              {addingVac ? 'Adding…' : '+ Add Trip'}
            </button>
          </form>
        </div>
      )}

      {showUnlock && <SpicyUnlockModal mode="unlock" onClose={() => setShowUnlock(false)} />}
    </div>
  );
}
