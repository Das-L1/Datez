import { useState, useEffect } from 'react';
import { useSpicy } from '../context/SpicyContext';

export function SpicyUnlockModal({ onClose, mode = 'unlock' }) {
  // mode: 'unlock' (first time) | 'topup' (buy more likes)
  const { unlock, spicyLikes } = useSpicy();
  const [tab, setTab] = useState('ad'); // 'ad' | 'premium'
  const [adState, setAdState] = useState('idle'); // idle | watching | done
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Ad countdown
  useEffect(() => {
    if (adState !== 'watching') return;
    if (countdown <= 0) { setAdState('done'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [adState, countdown]);

  async function claimAd() {
    setLoading(true);
    try {
      const data = await unlock('ad');
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function claimPremium() {
    setLoading(true);
    try {
      const data = await unlock('premium');
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
        <div className="bg-[var(--skin-fill)] rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border border-[var(--skin-border)]">
          <div className="text-6xl mb-4">🌶️</div>
          <h2 className="text-2xl font-black heading-gradient mb-2">Spicy Mode Unlocked!</h2>
          <p className="text-[var(--skin-muted)] text-sm mb-2">
            You got <strong className="text-[var(--skin-accent)]">{result.granted} Spicy Likes</strong>
          </p>
          <p className="text-[var(--skin-muted)] text-sm mb-6">
            Total balance: <strong className="text-[var(--skin-text)]">{result.spica_likes}</strong>
          </p>
          <button
            onClick={onClose}
            className="btn-primary w-full py-3 rounded-2xl"
          >
            Let's Get Spicy 🔥
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--skin-fill)] rounded-3xl w-full max-w-sm shadow-2xl border border-[var(--skin-border)] overflow-hidden">

        {/* Header */}
        <div className="p-6 pb-0 text-center">
          <div className="text-5xl mb-3">🌶️</div>
          <h2 className="text-2xl font-black heading-gradient">
            {mode === 'topup' ? 'Get More Spicy Likes' : 'Unlock Spicy Mode'}
          </h2>
          {mode === 'unlock' ? (
            <p className="text-[var(--skin-muted)] text-sm mt-1">
              See hidden kinks, dark theme, and super-likes
            </p>
          ) : (
            <p className="text-[var(--skin-muted)] text-sm mt-1">
              Current balance: <strong className="text-[var(--skin-accent)]">{spicyLikes}</strong>
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 m-4 bg-[var(--skin-fill-2)] p-1 rounded-2xl">
          {['ad', 'premium'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-[var(--skin-fill)] text-[var(--skin-accent)] shadow'
                  : 'text-[var(--skin-muted)]'
              }`}
            >
              {t === 'ad' ? '📺 Watch Ad' : '💳 Go Premium'}
            </button>
          ))}
        </div>

        <div className="px-4 pb-6 space-y-4">
          {tab === 'ad' && (
            <>
              <div className="surface border rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-[var(--skin-accent)]">FREE</p>
                <p className="text-[var(--skin-text)] font-semibold mt-1">10 Spicy Likes</p>
                <p className="text-xs text-[var(--skin-muted)] mt-1">Watch a 5-second ad</p>
              </div>

              {adState === 'idle' && (
                <button
                  onClick={() => { setAdState('watching'); setCountdown(5); }}
                  className="btn-primary w-full py-3 rounded-2xl"
                >
                  Watch Ad ▶
                </button>
              )}

              {adState === 'watching' && (
                <div className="surface border rounded-2xl p-5 text-center space-y-3">
                  {/* Fake ad */}
                  <div className="bg-[var(--skin-fill-2)] rounded-xl p-4 text-xs text-[var(--skin-muted)] italic">
                    📢 "Datez Premium — find deeper connections. Try free for 7 days."
                  </div>
                  <div className="relative">
                    <div className="w-14 h-14 mx-auto">
                      <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-14 h-14">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--skin-border)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke="var(--skin-accent)" strokeWidth="3"
                          strokeDasharray={`${(5 - countdown) / 5 * 100} 100`}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-black text-xl text-[var(--skin-accent)]">
                        {countdown}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--skin-muted)]">Please wait…</p>
                </div>
              )}

              {adState === 'done' && (
                <button
                  onClick={claimAd}
                  disabled={loading}
                  className="btn-primary w-full py-3 rounded-2xl"
                >
                  {loading ? 'Claiming…' : '🎉 Claim 10 Spicy Likes!'}
                </button>
              )}
            </>
          )}

          {tab === 'premium' && (
            <>
              <div className="surface border rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--skin-text)] font-semibold">30 Spicy Likes</span>
                  <span className="text-2xl font-black text-[var(--skin-accent)]">$4.99</span>
                </div>
                <ul className="text-xs text-[var(--skin-muted)] space-y-1 mt-2">
                  <li>✅ 3× more likes than the free ad</li>
                  <li>✅ Priority match notifications</li>
                  <li>✅ Exclusive 🌶️ badge on your profile</li>
                </ul>
              </div>
              <button
                onClick={claimPremium}
                disabled={loading}
                className="btn-primary w-full py-3 rounded-2xl"
              >
                {loading ? 'Processing…' : '💳 Pay $4.99 (simulated)'}
              </button>
              <p className="text-center text-xs text-[var(--skin-muted)]">
                This is a demo — no real payment is made
              </p>
            </>
          )}

          <button
            onClick={onClose}
            className="btn-secondary w-full py-2.5 rounded-2xl text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
