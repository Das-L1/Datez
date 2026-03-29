import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/RoleBadge';

const TIP_AMOUNTS = [5, 10, 25, 50, 100, 200];

export function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [tips, setTips] = useState([]);
  const [partner, setPartner] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(25);
  const [tipMessage, setTipMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const [msgs, tipData] = await Promise.all([
        api.get(`/messages/${matchId}`),
        api.get(`/messages/${matchId}/tips`),
      ]);
      setMessages(msgs);
      setTips(tipData);
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  useEffect(() => {
    async function init() {
      try {
        // Get match partner info via matches list
        const matches = await api.get('/swipes/matches');
        const m = matches.find(x => x.match_id === parseInt(matchId));
        if (m) setPartner(m);
        await loadMessages();
      } finally {
        setLoading(false);
      }
    }
    init();
    // Poll for new messages every 3s
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [matchId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tips]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.post(`/messages/${matchId}`, { content: text.trim() });
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function sendTip() {
    if (sending) return;
    setSending(true);
    try {
      const tip = await api.post(`/messages/${matchId}/tips`, { amount: tipAmount, message: tipMessage || null });
      setTips(prev => [...prev, { ...tip, sender_name: user.name }]);
      setShowTipModal(false);
      setTipMessage('');
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  // Merge messages and tips into a unified timeline
  const timeline = [...messages.map(m => ({ ...m, _type: 'message' })), ...tips.map(t => ({ ...t, _type: 'tip' }))]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/matches')} className="text-slate-400 hover:text-slate-600 mr-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {partner && (
          <>
            <img src={partner.photo_url} alt={partner.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{partner.name}</span>
                <RoleBadge type={partner.profile_type} allowance={partner.allowance_expectation} />
              </div>
              {partner.tips_received > 0 && (
                <p className="text-xs text-amber-500">💰 ${partner.tips_received} received total</p>
              )}
            </div>
            {/* Tip button — visible when partner is sugar role or can receive tips */}
            <button
              onClick={() => setShowTipModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold hover:bg-amber-100 transition-colors"
            >
              💰 Tip
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-2">👋</p>
            <p>Say hello to {partner?.name}!</p>
          </div>
        ) : (
          timeline.map(item => {
            if (item._type === 'tip') {
              const isSender = item.sender_id === user.id;
              return (
                <div key={`tip-${item.id}`} className="flex justify-center">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 text-center max-w-xs">
                    <p className="text-amber-600 font-bold text-lg">💰 ${item.amount} tip</p>
                    <p className="text-xs text-amber-500">
                      {isSender ? 'You' : item.sender_name} sent a tip
                    </p>
                    {item.message && <p className="text-sm text-slate-600 mt-1 italic">"{item.message}"</p>}
                  </div>
                </div>
              );
            }
            const isMe = item.sender_id === user.id;
            return (
              <div key={`msg-${item.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                }`}>
                  {item.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 px-4 py-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-md transition-shadow flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 rotate-45">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-1">Send a Tip 💰</h3>
            <p className="text-sm text-slate-500 mb-4">Show {partner?.name} some appreciation</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {TIP_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-3 rounded-2xl font-bold transition-all ${
                    tipAmount === amt
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <input
                type="number"
                placeholder="Custom amount"
                value={tipAmount}
                onChange={e => setTipAmount(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
              />
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Add a message (optional)"
                value={tipMessage}
                onChange={e => setTipMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowTipModal(false); setTipMessage(''); }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendTip}
                disabled={tipAmount <= 0 || sending}
                className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : `Send $${tipAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
