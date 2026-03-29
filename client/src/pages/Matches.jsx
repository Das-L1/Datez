import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { RoleBadge } from '../components/RoleBadge';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
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
    api.get('/swipes/matches')
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-4">
      <h1 className="text-2xl font-black text-slate-800 mb-4">Your Matches</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-6xl mb-4">💔</div>
          <p className="font-semibold text-lg">No matches yet</p>
          <p className="text-sm mt-1">Keep swiping to find your match!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <button
              key={m.match_id}
              onClick={() => navigate(`/chat/${m.match_id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={m.photo_url}
                  alt={m.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {m.tips_received > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    $
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-slate-800">{m.name}</span>
                  <RoleBadge type={m.profile_type} allowance={m.allowance_expectation} />
                </div>
                {m.last_message ? (
                  <p className="text-sm text-slate-500 truncate">{m.last_message}</p>
                ) : (
                  <p className="text-sm text-rose-400 italic">Say hello!</p>
                )}
                {m.tips_received > 0 && (
                  <p className="text-xs text-amber-500 font-medium mt-0.5">
                    💰 ${m.tips_received} received
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">
                {timeAgo(m.last_message_at || m.matched_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
