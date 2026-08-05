'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const NavigationProgress: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Finish loading animation when path or search params change
    setProgress(100);
    const timer = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for link clicks to trigger progress start instantly
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        const url = new URL(anchor.href);
        if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
          setLoading(true);
          setProgress(35);
          const t1 = setTimeout(() => setProgress(70), 80);
          const t2 = setTimeout(() => setProgress(90), 250);
          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
          };
        }
      }
    };

    window.addEventListener('click', handleLinkClick, { capture: true });
    return () => window.removeEventListener('click', handleLinkClick, { capture: true });
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-blue-600 to-blue-800 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 100ms ease-out, opacity 200ms ease-in 100ms' : 'width 200ms ease-out',
        }}
      />
    </div>
  );
};
