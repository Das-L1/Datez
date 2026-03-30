import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const SpicyContext = createContext(null);

export const KINK_GROUPS = [
  {
    id: 'power',
    label: 'Power & Control',
    emoji: '⛓️',
    kinks: [
      'Dominant', 'Submissive', 'Switch', 'Power exchange',
      'Total power exchange', 'Bratting', 'Praise kink',
      'Humiliation', 'Degradation', 'Financial domination',
      'Service submission', 'Daddy/Mommy Dom', 'Master/Slave',
      'Ownership', 'Collaring', 'Obedience training',
    ],
  },
  {
    id: 'bondage',
    label: 'Bondage & Restraint',
    emoji: '🔗',
    kinks: [
      'Rope bondage', 'Shibari', 'Handcuffs', 'Spreader bars',
      'Mummification', 'Hogtie', 'Predicament bondage',
      'Blindfolds', 'Sensory deprivation', 'Self-bondage',
      'Strappado', 'Armbinder', 'Chastity',
    ],
  },
  {
    id: 'sensation',
    label: 'Sensation Play',
    emoji: '🕯️',
    kinks: [
      'Wax play', 'Temperature play', 'Impact play',
      'Flogging', 'Spanking', 'Caning', 'Paddling',
      'Tickling', 'Electrostimulation', 'Breath play',
      'Edge play', 'Knife play', 'Sensation wheels',
      'Massage', 'Cupping', 'Fire play',
    ],
  },
  {
    id: 'roleplay',
    label: 'Roleplay & Fantasy',
    emoji: '🎭',
    kinks: [
      'Roleplay', 'Pet play', 'Pony play', 'Puppy play',
      'Kitten play', 'CNC', 'Costumes', 'Uniform fetish',
      'Medical play', 'Teacher/Student', 'Age play',
      'Taboo roleplay', 'Boss/Employee', 'Stranger fantasy',
      'Kidnap fantasy', 'Superhero/Villain', 'Historical roleplay',
    ],
  },
  {
    id: 'exhibition',
    label: 'Exhibition & Voyeurism',
    emoji: '👁️',
    kinks: [
      'Exhibitionism', 'Voyeurism', 'Public play',
      'Outdoor play', 'Mirror play', 'Cuckolding',
      'Hotwifing', 'Stag/Vixen', 'Swinging',
      'Dogging', 'Camming', 'Shared fantasy',
    ],
  },
  {
    id: 'fetish',
    label: 'Fetish & Materials',
    emoji: '👠',
    kinks: [
      'Leather', 'Latex/PVC', 'Lingerie', 'Stockings',
      'Foot worship', 'Boots', 'Gloves', 'Fur',
      'Corsets', 'Heels', 'Spandex/Lycra', 'Silk/Satin',
      'Jockstraps', 'Uniforms', 'Aprons', 'Onesies',
    ],
  },
  {
    id: 'body',
    label: 'Body & Intimacy',
    emoji: '💋',
    kinks: [
      'Body worship', 'Hair pulling', 'Biting',
      'Marking', 'Breast play', 'Oral fixation',
      'Pegging', 'Fisting', 'Squirting',
      'Tantric sex', 'Edging', 'Orgasm denial',
      'Orgasm control', 'Multiple orgasms', 'Ruined orgasm',
      'Cum play', 'Breeding kink',
    ],
  },
  {
    id: 'psychology',
    label: 'Psychology & Mind',
    emoji: '🧠',
    kinks: [
      'Hypnosis/Erotic hypnosis', 'Mind control fantasy',
      'Gaslighting play', 'Brainwashing fantasy',
      'Conditioning', 'Objectification', 'Body modification',
      'Somnophilia', 'Somnambulism play',
      'Guided meditation sex', 'Ritual play',
    ],
  },
  {
    id: 'group',
    label: 'Group & Social',
    emoji: '👥',
    kinks: [
      'Threesome (MMF)', 'Threesome (FFM)', 'Group sex',
      'Gang bang', 'Orgy', 'Polyamory', 'Open relationship',
      'Friends with benefits', 'Kink events/parties',
      'Munches', 'Play parties', 'Online communities',
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Dynamics',
    emoji: '🏠',
    kinks: [
      '24/7 D/s dynamic', 'DDLG', 'MDlb', 'CGL',
      'Domestic service', 'Human furniture',
      'Kept/Kept dynamic', 'Trophy dynamic',
      'Financial arrangement', 'Mentorship dynamic',
      'Live-in dynamic', 'Long-distance D/s',
    ],
  },
  {
    id: 'misc',
    label: 'Miscellaneous',
    emoji: '✨',
    kinks: [
      'ASMR', 'Tantric', 'Tantra massage', 'Sensual dancing',
      'Strip tease', 'Dirty talk', 'Sexting', 'Phone sex',
      'Voice kink', 'Size difference', 'Height difference',
      'Age gap', 'Taboo attraction', 'Forbidden fruit',
      'Consensual non-consent fantasy', 'Risk-aware play',
    ],
  },
];

// Flat array for backward compat (seed data, card display)
export const KINKS = KINK_GROUPS.flatMap(g => g.kinks);


export function SpicyProvider({ children }) {
  const [spicyMode, setSpicyMode] = useState(false);
  const [spicyLikes, setSpicyLikes] = useState(0);
  const [spicyUnlocked, setSpicyUnlocked] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { spica_unlocked, spica_likes } = await api.get('/spica/status');
      setSpicyUnlocked(!!spica_unlocked);
      setSpicyLikes(spica_likes);
      if (spica_unlocked && localStorage.getItem('spicy_on') === '1') {
        setSpicyMode(true);
      }
    } catch { /* not logged in yet */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Apply/remove .spica class on root element
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (spicyMode) {
      root.classList.add('spicy');
      localStorage.setItem('spicy_on', '1');
    } else {
      root.classList.remove('spicy');
      localStorage.setItem('spicy_on', '0');
    }
  }, [spicyMode]);

  async function unlock(method) {
    const data = await api.post('/spica/unlock', { method });
    setSpicyUnlocked(true);
    setSpicyLikes(data.spica_likes);
    setSpicyMode(true);
    return data;
  }

  async function useSpicyLike(targetId) {
    const data = await api.post('/spica/like', { target_id: targetId });
    setSpicyLikes(data.spica_likes);
    return data;
  }

  function toggleSpicyMode() {
    if (!spicyUnlocked) return false; // caller should show modal
    setSpicyMode(v => !v);
    return true;
  }

  return (
    <SpicyContext.Provider value={{
      spicyMode,
      spicyLikes,
      spicyUnlocked,
      unlock,
      useSpicyLike,
      toggleSpicyMode,
      refreshStatus: fetchStatus,
    }}>
      {children}
    </SpicyContext.Provider>
  );
}

export function useSpicy() {
  return useContext(SpicyContext);
}
