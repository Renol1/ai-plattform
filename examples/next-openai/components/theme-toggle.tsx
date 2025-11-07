"use client";

import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // initialize from localStorage or system
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      aria-label={isDark ? 'Växla till ljust läge' : 'Växla till mörkt läge'}
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 h-8 w-8 text-sm ${className}`}
      title={isDark ? 'Ljust läge' : 'Mörkt läge'}
    >
      {isDark ? '☾' : '☀︎'}
    </button>
  );
}
