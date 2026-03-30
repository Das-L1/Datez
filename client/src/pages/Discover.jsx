import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import { SpicyUnlockModal } from '../components/SpicyUnlockModal';
import { useSpicy } from '../context/SpicyContext';

export function Discover() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockMode, setUnlockMode] = useState('unlock');

  const { spicyMode, spicyLikes, spicyUnlocked, toggleSpicyMode, useSpicyLike } = useSpicy();

  const load = useCallback(async () => {
    try {
      const data = await api.get('/swipes/discover');
      setUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        return [...prev, ...data.filter(u => !existingIds.has(u.id))];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSwipe(direction) {
    if (animating || users.length === 0) return;
    setAnimating(true);
    const [current, ...rest] = users;
    setUsers(rest);
    try {
      const result = await api.post('/swipes', { swiped_id: current.id, direction });
      if (result.matched) setMatch({ user: current, matchId: result.matchId });
    } catch (e) { console.error(e); }
    if (rest.length < 4) load();
    setAnimating(false);
  }

  async function handleSpicyLike() {
    if (animating || users.length === 0) return;
    if (!spicyUnlocked || spicyLikes < 1) {
      setUnlockMode(spicyUnlocked ? 'topup' : 'unlock');
      setShowUnlock(true);
      return;
    }
    setAnimating(true);
    const [current, ...rest] = users;
    setUsers(rest);
    try {
      const result = await useSpicyLike(current.id);
      if (result.matched) setMatch({ user: current, matchId: result.matchId });
    } catch (e) {
      if (e.message.includes('No Spicy')) {
        setUnlockMode('topup');
        setShowUnlock(true);
      }
    }
    if (rest.length < 4) load();
    setAnimating(false);
  }

  function handleSpicyToggle() {
    if (!toggleSpicyMode()) {
      setUnlockMode('unlock');
      setShowUnlock(true);
    }
  }

  const topThree = users.slice(0, 3);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] px-4 pt-4" style={{ background: 'var(--skin-bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black heading-gradient">
          {spicyMode ? '🌶️ Spicy' : 'Datez 💘'}
        </h1>
        <button
          onClick={handleSpicyToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-sm border transition-all ${
            spicyMode
              ? 'bg-red-900/60 border-red-700 text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
              : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300'
          }`}
        >
          <span>🌶️</span>
          <span>{spicyMode ? 'ON' : 'Spicy Mode'}</span>
          {spicyMode && spicyLikes > 0 && (
            <span className="bg-red-700 text-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {spicyLikes}
            </span>
          )}
        </button>
      </div>

      {/* Spicy mode banner */}
      {spicyMode && (
        <div className="mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
          style={{ background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(127,29,29,0.7)', color: '#fca5a5' }}>
          <span>🌶️</span>
          <span>Spicy Mode active — kinks visible · {spicyLikes} super-likes remaining</span>
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--skin-accent)', borderTopColor: 'transparent' }} />
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{spicyMode ? '🔥' : '🌟'}</div>
            <p className="font-semibold text-lg" style={{ color: 'var(--skin-text)' }}>You've seen everyone!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--skin-muted)' }}>Check back later for new profiles</p>
            <button onClick={() => { setLoading(true); load(); }}
              className="btn-primary mt-4 px-6 py-2 rounded-2xl text-sm">
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: '480px' }}>
            {[...topThree].reverse().map((user, ri) => {
              const stackIndex = topThree.length - 1 - ri;
              return (
                <SwipeCard key={user.id} user={user} onSwipe={handleSwipe} stackIndex={stackIndex} />
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {users.length > 0 && (
        <div className="flex justify-center items-center gap-5 py-4 mb-2">
          {/* Pass */}
          <button onClick={() => handleSwipe('pass')} disabled={animating}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 disabled:opacity-50 border-2 shadow"
            style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)', color: '#f87171' }}>
            ✕
          </button>

          {/* Spicy Like — only shown in spicy mode */}
          {spicyMode && (
            <button onClick={handleSpicyLike} disabled={animating}
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 disabled:opacity-50 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #450a0a)', boxShadow: '0 0 16px rgba(220,38,38,0.5)' }}
              title={`Spicy Like (${spicyLikes} left)`}>
              🌶️
            </button>
          )}

          {/* Like */}
          <button onClick={() => handleSwipe('like')} disabled={animating}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 disabled:opacity-50 shadow-lg btn-primary">
            ♥
          </button>
        </div>
      )}

      {match && <MatchModal match={match} onClose={() => setMatch(null)} />}
      {showUnlock && <SpicyUnlockModal mode={unlockMode} onClose={() => setShowUnlock(false)} />}
    </div>
  );
}
