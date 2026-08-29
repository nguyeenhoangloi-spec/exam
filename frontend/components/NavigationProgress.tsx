'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top Navigation Progress Bar
 * Provides instant, silky-smooth visual feedback when navigating between routes.
 */
export const NavigationProgress: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete progress on route change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on navigation links to start progress immediately
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.startsWith('/#') &&
        !target.getAttribute('target') &&
        !target.getAttribute('download') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const [targetPath] = href.split('?');
        const [currentPath] = (window.location.pathname + window.location.search).split('?');
        
        // If clicking a different route, trigger smooth progress bar
        if (targetPath !== currentPath || href !== window.location.pathname + window.location.search) {
          if (timerRef.current) clearTimeout(timerRef.current);
          setVisible(true);
          setProgress(25);
          timerRef.current = setTimeout(() => {
            setProgress((prev) => (prev < 80 ? 75 : prev));
          }, 150);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none overflow-hidden transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.7)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
};

