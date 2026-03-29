import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const SpicyContext = createContext(null);

export const KINKS = [
  'Roleplay', 'BDSM', 'Outdoors', 'Exhibitionism',
  'Voyeurism', 'Dominant', 'Submissive', 'Leather',
  'Lingerie', 'Costumes', 'Massage', 'Sensory play',
  'Foot worship', 'Power exchange', 'Blindfolds',
  'Wax play', 'Temperature play', 'Impact play',
  'Bondage', 'Edge play', 'Pet play',
];

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
