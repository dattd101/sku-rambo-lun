'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'rambo-lun-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    setTheme(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const chooseTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Theme still works even when storage is unavailable.
    }
  };

  return (
    <div className="themeToggle" role="group" aria-label="Chọn giao diện sáng hoặc tối">
      <button
        type="button"
        className={theme === 'light' && ready ? 'themeOption active' : 'themeOption'}
        aria-pressed={theme === 'light'}
        onClick={() => chooseTheme('light')}
      >
        ☀ Sáng
      </button>
      <button
        type="button"
        className={theme === 'dark' && ready ? 'themeOption active' : 'themeOption'}
        aria-pressed={theme === 'dark'}
        onClick={() => chooseTheme('dark')}
      >
        ☾ Tối
      </button>
    </div>
  );
}
