const ROLES = {
  sugar_daddy: { label: 'Sugar Daddy', color: 'bg-amber-500', emoji: '💎' },
  sugar_mommy: { label: 'Sugar Mommy', color: 'bg-purple-500', emoji: '👑' },
  sugar_baby:  { label: 'Sugar Baby',  color: 'bg-pink-400',   emoji: '🍭' },
};

export function RoleBadge({ type, allowance, size = 'sm' }) {
  const role = ROLES[type];
  if (!role) return null;

  const text = size === 'lg'
    ? `${role.emoji} ${role.label}${allowance ? ` · $${allowance}/mo` : ''}`
    : `${role.emoji} ${role.label}`;

  return (
    <span className={`${role.color} text-white font-semibold rounded-full px-2 py-0.5 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
      {text}
    </span>
  );
}
