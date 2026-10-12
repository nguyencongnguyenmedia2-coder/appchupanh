import { useState, useEffect } from 'react';
import { db } from '../storage/db';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load theme setting from DB
    db.settings.get('appSettings').then((rec) => {
      if (rec && rec.value && rec.value.theme) {
        setTheme(rec.value.theme);
        applyTheme(rec.value.theme);
      } else {
        applyTheme('dark');
      }
    });
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);

    const rec = await db.settings.get('appSettings');
    if (rec) {
      rec.value.theme = nextTheme;
      await db.settings.put(rec);
    }
  };

  return { theme, toggleTheme };
}
