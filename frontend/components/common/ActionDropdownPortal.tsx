import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

interface ActionDropdownPortalProps {
  children: (closeMenu: () => void) => React.ReactNode;
  trigger?: React.ReactNode;
}

export const ActionDropdownPortal: React.FC<ActionDropdownPortalProps> = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number; openUp: boolean }>({ top: 0, right: 0, openUp: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > 220;

      setCoords({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right + 4),
        openUp,
      });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => setIsOpen(false);
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={toggleMenu}
        className="ui-pressable inline-flex shrink-0 h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors duration-150 cursor-pointer"
        title="Thao tác khác"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              right: `${coords.right}px`,
            }}
            className="z-[99999] min-w-[210px] w-max max-w-xs rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-apple-modal text-type-body-sm font-medium text-slate-700 dark:text-slate-200 space-y-0.5 text-left animate-popover-in will-change-transform"
          >
            {children(() => setIsOpen(false))}
          </div>,
          document.body
        )}
    </>
  );
};
