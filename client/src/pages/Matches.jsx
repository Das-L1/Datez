import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { RoleBadge } from '../components/RoleBadge';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/swipes/matches').then(setMatches).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-4" style={{ background: 'var(--skin-bg)', minHeight: '100%' }}>
      <h1 className="text-2xl font-black mb-4" style={{ color: 'var(--skin-text)' }}>Your Matches</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--skin-accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">💔</div>
          <p className="font-semibold text-lg" style={{ color: 'var(--skin-text)' }}>No matches yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--skin-muted)' }}>Keep swiping to find your match!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <button key={m.match_id} onClick={() => navigate(`/chat/${m.match_id}`)}
              className="w-full rounded-2xl p-4 flex items-center gap-4 text-left border transition-shadow hover:shadow-md surface"
              style={{ borderColor: 'var(--skin-border)' }}>
              <div className="relative flex-shrink-0">
                <img src={m.photo_url} alt={m.name} className="w-14 h-14 rounded-full object-cover" />
                {m.tips_received > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">$</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold" style={{ color: 'var(--skin-text)' }}>{m.name}</span>
                  <RoleBadge type={m.profile_type} allowance={m.allowance_expectation} />
                </div>
                {m.last_message ? (
                  <p className="text-sm truncate" style={{ color: 'var(--skin-muted)' }}>{m.last_message}</p>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--skin-accent)' }}>Say hello!</p>
                )}
                {m.tips_received > 0 && (
                  <p className="text-xs text-amber-500 font-medium mt-0.5">💰 ${m.tips_received} received</p>
                )}
              </div>
              <div className="text-xs flex-shrink-0" style={{ color: 'var(--skin-muted)' }}>
                {timeAgo(m.last_message_at || m.matched_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
