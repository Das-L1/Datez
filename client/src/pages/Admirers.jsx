import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';

const AD_WATCH_SECS = 5;

const MOOD_MAP = {
  hot: '🔥', adventurous: '😈', lowkey: '☕', travel: '✈️',
  party: '🎉', company: '💆', secret: '🤫', busy: '💼',
  night: '🌙', slow: '🌿',
};

export function Admirers() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(null); // userId being revealed
  const [adState, setAdState] = useState({ active: false, countdown: AD_WATCH_SECS, targetId: null });

  async function load() {
    setLoading(true);
    try { setData(await api.get('/admirers')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Ad countdown ticker
  useEffect(() => {
    if (!adState.active) return;
    if (adState.countdown <= 0) {
      finishReveal(adState.targetId, 'ad');
      return;
    }
    const t = setTimeout(() => setAdState(s => ({ ...s, countdown: s.countdown - 1 })), 1000);
    return () => clearTimeout(t);
  }, [adState]);

  async function finishReveal(targetId, method) {
    setAdState({ active: false, countdown: AD_WATCH_SECS, targetId: null });
    setRevealing(targetId);
    try {
      const revealed = await api.post(`/admirers/${targetId}/reveal`, { method });
      updateUser({ points: revealed.points ?? user.points });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setRevealing(null);
    }
  }

  function startAdReveal(tokenId) {
    setAdState({ active: true, countdown: AD_WATCH_SECS, targetId: tokenId });
  }

  async function revealWithPoints(tokenId) {
    if ((user.points ?? 0) < (data?.reveal_cost_points ?? 50)) {
      alert(`You need ${data?.reveal_cost_points ?? 50} points to reveal. Keep chatting to earn more!`);
      return;
    }
    await finishReveal(tokenId, 'points');
  }

  // Like back an admirer after revealing
  async function likeBack(userId) {
    try {
      const result = await api.post('/swipes', { swiped_id: userId, direction: 'like' });
      if (result.matched) navigate(`/chat/${result.matchId}`);
      else await load();
    } catch (e) { console.error(e); }
  }

  return (
    <div className="px-4 pt-4 pb-4" style={{ background: 'var(--skin-bg)', minHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black" style={{ color: 'var(--skin-text)' }}>Secret Admirers 💌</h1>
        {data && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--skin-fill-2)', color: 'var(--skin-accent)' }}>
            ⚡ {user.points ?? 0} pts
          </div>
        )}
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--skin-muted)' }}>
        {data ? `${data.count} ${data.count === 1 ? 'person has' : 'people have'} liked you` : ''}
      </p>

      {/* Ad overlay */}
      {adState.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="rounded-3xl p-8 w-full max-w-sm text-center border"
            style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)' }}>
            <p className="text-4xl mb-3">📺</p>
            <p className="font-black text-lg mb-1" style={{ color: 'var(--skin-text)' }}>Watching ad…</p>
            <p className="text-sm mb-5" style={{ color: 'var(--skin-muted)' }}>
              "Datez Premium — deeper connections. Free for 7 days."
            </p>
            {/* Circular countdown */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--skin-border)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke="var(--skin-accent)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${((AD_WATCH_SECS - adState.countdown) / AD_WATCH_SECS) * 100} 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-black text-xl"
                style={{ color: 'var(--skin-accent)' }}>
                {adState.countdown}
              </span>
            </div>
            <button onClick={() => setAdState({ active: false, countdown: AD_WATCH_SECS, targetId: null })}
              className="btn-secondary px-6 py-2 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--skin-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : data?.admirers?.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💌</div>
          <p className="font-semibold text-lg" style={{ color: 'var(--skin-text)' }}>No admirers yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--skin-muted)' }}>Keep swiping — someone will like you back!</p>
        </div>
      ) : (
        <>
          {/* Reveal costs info */}
          <div className="rounded-2xl p-3 border mb-4 flex items-center justify-between text-xs"
            style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)' }}>
            <span style={{ color: 'var(--skin-muted)' }}>
              📺 {data.free_reveals_left} free reveal{data.free_reveals_left !== 1 ? 's' : ''} left today
            </span>
            <span style={{ color: 'var(--skin-muted)' }}>
              ⚡ {data.reveal_cost_points} pts per reveal
            </span>
          </div>

          <div className="space-y-3">
            {data.admirers.map((admirer, i) => (
              <AdmirerCard
                key={admirer.token ?? i}
                admirer={admirer}
                freeLeft={data.free_reveals_left}
                points={user.points ?? 0}
                costPoints={data.reveal_cost_points}
                revealing={revealing === admirer.token}
                onWatchAd={() => startAdReveal(admirer.token)}
                onUsePoints={() => revealWithPoints(admirer.token)}
                onLikeBack={() => likeBack(admirer.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AdmirerCard({ admirer, freeLeft, points, costPoints, revealing, onWatchAd, onUsePoints, onLikeBack }) {
  const [showRevealOptions, setShowRevealOptions] = useState(false);

  if (admirer.revealed) {
    return (
      <div className="rounded-2xl border p-4 flex items-center gap-4 surface"
        style={{ borderColor: admirer.is_match ? 'var(--skin-accent)' : 'var(--skin-border)' }}>
        <img src={admirer.photo_url} alt={admirer.name}
          className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2"
          style={{ borderColor: 'var(--skin-accent)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold" style={{ color: 'var(--skin-text)' }}>{admirer.name}, {admirer.age}</span>
            <RoleBadge type={admirer.profile_type} />
            {admirer.mood && (
              <span className="text-base">{MOOD_MAP[admirer.mood] ?? '✨'}</span>
            )}
          </div>
          {admirer.is_match ? (
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--skin-accent)' }}>💘 Already matched!</p>
          ) : (
            <button onClick={onLikeBack}
              className="btn-primary mt-2 px-4 py-1.5 rounded-xl text-xs">
              ❤️ Like back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4 surface" style={{ borderColor: 'var(--skin-border)' }}>
      <div className="flex items-center gap-4">
        {/* Blurred photo */}
        <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden relative">
          <div className="w-full h-full rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'var(--skin-fill-2)', filter: 'blur(0px)' }}>
            👤
          </div>
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--skin-border), var(--skin-fill-2))' }} />
        </div>
        <div className="flex-1">
          <p className="font-bold" style={{ color: 'var(--skin-text)' }}>Someone likes you ✨</p>
          <p className="text-xs" style={{ color: 'var(--skin-muted)' }}>Reveal to see who</p>
        </div>
        <button
          onClick={() => setShowRevealOptions(v => !v)}
          disabled={revealing}
          className="btn-primary px-3 py-2 rounded-xl text-sm"
        >
          {revealing ? '…' : 'Reveal'}
        </button>
      </div>

      {showRevealOptions && (
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2"
          style={{ borderColor: 'var(--skin-border)' }}>
          <button
            onClick={() => { setShowRevealOptions(false); onWatchAd(); }}
            disabled={freeLeft <= 0}
            className="py-2.5 rounded-xl text-sm font-semibold border transition-opacity disabled:opacity-40"
            style={{ background: 'var(--skin-fill-2)', borderColor: 'var(--skin-border)', color: 'var(--skin-text)' }}>
            📺 Watch ad
            <span className="block text-xs mt-0.5" style={{ color: 'var(--skin-muted)' }}>
              {freeLeft} left today
            </span>
          </button>
          <button
            onClick={() => { setShowRevealOptions(false); onUsePoints(); }}
            disabled={points < costPoints}
            className="py-2.5 rounded-xl text-sm font-semibold border transition-opacity disabled:opacity-40"
            style={{ background: 'var(--skin-fill-2)', borderColor: 'var(--skin-border)', color: 'var(--skin-text)' }}>
            ⚡ {costPoints} pts
            <span className="block text-xs mt-0.5" style={{ color: points < costPoints ? '#ef4444' : 'var(--skin-muted)' }}>
              {points < costPoints ? `Need ${costPoints - points} more` : `You have ${points}`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
