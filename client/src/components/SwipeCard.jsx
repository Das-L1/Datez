import { useState, useRef } from 'react';
import { RoleBadge } from './RoleBadge';
import { useSpicy } from '../context/SpicyContext';

const THRESHOLD = 90;

export function SwipeCard({ user, onSwipe, stackIndex }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const start = useRef({ x: 0, y: 0 });
  const isTop = stackIndex === 0;
  const { spicyMode } = useSpicy();

  const stackStyles = [
    { zIndex: 30, transform: 'scale(1) translateY(0px)' },
    { zIndex: 20, transform: 'scale(0.96) translateY(12px)' },
    { zIndex: 10, transform: 'scale(0.92) translateY(24px)' },
  ];

  function onStart(cx, cy) {
    if (!isTop) return;
    start.current = { x: cx, y: cy };
    setDrag({ x: 0, y: 0, active: true });
  }
  function onMove(cx, cy) {
    if (!drag.active) return;
    setDrag(d => ({ ...d, x: cx - start.current.x, y: cy - start.current.y }));
  }
  function onEnd() {
    if (!drag.active) return;
    if (drag.x > THRESHOLD) onSwipe('like');
    else if (drag.x < -THRESHOLD) onSwipe('pass');
    else setDrag({ x: 0, y: 0, active: false });
  }

  const rotation = drag.x * 0.07;
  const swipeProgress = Math.min(Math.abs(drag.x) / THRESHOLD, 1);
  const isLike = drag.x > 30;
  const isNope = drag.x < -30;

  const baseStyle = stackStyles[Math.min(stackIndex, 2)];
  const dragStyle = isTop && drag.active
    ? { transform: `translateX(${drag.x}px) translateY(${drag.y}px) rotate(${rotation}deg)`, zIndex: baseStyle.zIndex }
    : { ...baseStyle, transition: drag.active ? 'none' : 'transform 0.3s ease' };

  // Spicy: red/gold for LIKE, keep red for NOPE
  const likeColor = spicyMode ? '#fbbf24' : '#4ade80';
  const nopeColor = '#f87171';

  return (
    <div
      className="absolute inset-0 select-none touch-none"
      style={dragStyle}
      onMouseDown={e => onStart(e.clientX, e.clientY)}
      onMouseMove={e => onMove(e.clientX, e.clientY)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={onEnd}
    >
      <div
        className="w-full h-full rounded-3xl overflow-hidden shadow-xl relative"
        style={{
          background: spicyMode ? '#1a0000' : '#e2e8f0',
          cursor: isTop ? 'grab' : 'default',
          boxShadow: spicyMode ? '0 4px 32px rgba(220,38,38,0.25)' : undefined,
        }}
      >
        {/* Photo */}
        <img
          src={user.photo_url}
          alt={user.name}
          className="w-full h-full object-cover pointer-events-none"
          style={{ opacity: spicyMode ? 0.85 : 1 }}
          draggable={false}
        />

        {/* Spicy mode: dark vignette overlay */}
        {spicyMode && (
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
        )}

        {/* LIKE stamp */}
        {isLike && (
          <div
            className="absolute top-10 left-8 border-4 text-3xl font-black px-4 py-1 rounded-xl rotate-[-20deg]"
            style={{ borderColor: likeColor, color: likeColor, opacity: swipeProgress }}
          >
            {spicyMode ? '🔥 HOT' : 'LIKE'}
          </div>
        )}
        {/* NOPE stamp */}
        {isNope && (
          <div
            className="absolute top-10 right-8 border-4 text-3xl font-black px-4 py-1 rounded-xl rotate-[20deg]"
            style={{ borderColor: nopeColor, color: nopeColor, opacity: swipeProgress }}
          >
            NOPE
          </div>
        )}

        {/* Info overlay */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pt-16 pb-5 text-white"
          style={{ background: spicyMode
            ? 'linear-gradient(to top, rgba(80,0,0,0.95), rgba(40,0,0,0.7) 60%, transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.4) 60%, transparent)'
          }}
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-2xl font-bold">{user.name}, {user.age}</h2>
            <RoleBadge type={user.profile_type} allowance={user.allowance_expectation} />
          </div>
          {user.bio && <p className="text-sm opacity-90 line-clamp-2">{user.bio}</p>}

          {/* Kinks — only shown in spicy mode */}
          {spicyMode && user.kinks?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.kinks.slice(0, 4).map(k => (
                <span key={k} className="text-xs rounded-full px-2 py-0.5 font-semibold"
                  style={{ background: 'rgba(220,38,38,0.55)', border: '1px solid rgba(239,68,68,0.5)', color: '#fecaca' }}>
                  🌶️ {k}
                </span>
              ))}
            </div>
          )}

          {/* Upcoming vacations */}
          {user.vacations?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.vacations.slice(0, 2).map(v => (
                <span key={v.location + v.start_date} className="text-xs bg-white/20 backdrop-blur rounded-full px-2 py-0.5 flex items-center gap-1">
                  ✈️ {v.location}
                  <span className="opacity-70">{new Date(v.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </span>
              ))}
            </div>
          )}

          {user.tips_total > 0 && (
            <div className="mt-1 text-xs opacity-70">💰 ${user.tips_total.toLocaleString()} in tips</div>
          )}
        </div>
      </div>
    </div>
  );
}
