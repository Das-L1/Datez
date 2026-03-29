import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';

export function Discover() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [animating, setAnimating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/swipes/discover');
      setUsers(prev => {
        const existingIds = new Set(prev.map(u => u.id));
        const fresh = data.filter(u => !existingIds.has(u.id));
        return [...prev, ...fresh];
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
      if (result.matched) {
        setMatch({ user: current, matchId: result.matchId });
      }
    } catch (e) {
      console.error(e);
    }

    // Refill if running low
    if (rest.length < 4) load();
    setAnimating(false);
  }

  const topThree = users.slice(0, 3);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">
          Datez 💘
        </h1>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">🌟</div>
            <p className="font-semibold text-lg">You've seen everyone!</p>
            <p className="text-sm mt-1">Check back later for new profiles</p>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="mt-4 px-6 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: '480px' }}>
            {[...topThree].reverse().map((user, ri) => {
              const stackIndex = topThree.length - 1 - ri;
              return (
                <SwipeCard
                  key={user.id}
                  user={user}
                  onSwipe={handleSwipe}
                  stackIndex={stackIndex}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {users.length > 0 && (
        <div className="flex justify-center items-center gap-8 py-4 mb-2">
          <button
            onClick={() => handleSwipe('pass')}
            disabled={animating}
            className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center text-2xl hover:scale-110 hover:border-red-300 transition-transform disabled:opacity-50"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe('like')}
            disabled={animating}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-400 shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform disabled:opacity-50"
          >
            ♥
          </button>
        </div>
      )}

      {match && <MatchModal match={match} onClose={() => setMatch(null)} />}
    </div>
  );
}
