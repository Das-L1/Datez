import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpicy } from '../context/SpicyContext';

export function MatchModal({ match, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { spicyMode } = useSpicy();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
      style={{ background: spicyMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border"
        style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)' }}>
        <div className="text-7xl mb-4">{spicyMode ? '🌶️' : '💘'}</div>
        <h2 className="text-3xl font-black heading-gradient mb-1">
          {spicyMode ? 'Spicy Match!' : "It's a Match!"}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--skin-muted)' }}>
          You and <strong style={{ color: 'var(--skin-text)' }}>{match.user.name}</strong> liked each other
        </p>

        <div className="flex justify-center items-center gap-3 mb-8">
          <img src={user.photo_url || `https://i.pravatar.cc/80?u=${user.email}`} alt="You"
            className="w-20 h-20 rounded-full object-cover border-4 shadow-lg"
            style={{ borderColor: 'var(--skin-accent)' }} />
          <div className="text-2xl">{spicyMode ? '🔥' : '❤️'}</div>
          <img src={match.user.photo_url} alt={match.user.name}
            className="w-20 h-20 rounded-full object-cover border-4 shadow-lg"
            style={{ borderColor: spicyMode ? '#7f1d1d' : '#a855f7' }} />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { onClose(); navigate(`/chat/${match.matchId}`); }}
            className="btn-primary w-full py-3 rounded-2xl text-lg"
          >
            Send a Message
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full py-3 rounded-2xl"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
