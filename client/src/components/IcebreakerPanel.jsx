import { useState, useEffect } from 'react';
import { api } from '../api';

export function IcebreakerPanel({ matchId, onSend }) {
  const [prompts, setPrompts] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get(`/icebreakers/${matchId}`)
      .then(d => setPrompts(d.prompts))
      .catch(() => {});
  }, [matchId]);

  if (dismissed || prompts.length === 0) return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl border overflow-hidden"
      style={{ background: 'var(--skin-fill)', borderColor: 'var(--skin-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold" style={{ color: 'var(--skin-text)' }}>Icebreakers</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--skin-fill-2)', color: 'var(--skin-muted)' }}>
            tap to send
          </span>
        </div>
        <button onClick={() => setDismissed(true)}
          className="text-lg leading-none hover:opacity-60 transition-opacity"
          style={{ color: 'var(--skin-muted)' }}>
          ×
        </button>
      </div>

      {/* Prompts */}
      <div className="px-3 pb-3 space-y-2">
        {prompts.map((p, i) => (
          <button key={i} onClick={() => { onSend(p); setDismissed(true); }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all hover:opacity-80 active:scale-[0.98]"
            style={{
              background: 'var(--skin-fill-2)',
              borderColor: 'var(--skin-border)',
              color: 'var(--skin-text)',
            }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
