import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function MatchModal({ match, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
        {/* Heart burst */}
        <div className="text-7xl mb-4">💘</div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600 mb-1">
          It's a Match!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          You and <strong>{match.user.name}</strong> liked each other
        </p>

        {/* Avatars */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <img src={user.photo_url || `https://i.pravatar.cc/80?u=${user.email}`} alt="You"
            className="w-20 h-20 rounded-full object-cover border-4 border-rose-400 shadow-lg" />
          <div className="text-2xl">❤️</div>
          <img src={match.user.photo_url} alt={match.user.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-purple-400 shadow-lg" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { onClose(); navigate(`/chat/${match.matchId}`); }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            Send a Message
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
