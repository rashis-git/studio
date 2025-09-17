
'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('dayflow-theme') || 'theme-indigo';
    document.documentElement.className = savedTheme;
  }, []);

  return <>{children}</>;
}
