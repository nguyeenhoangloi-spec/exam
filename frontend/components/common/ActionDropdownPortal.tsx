import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

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
        right: Math.max(8, window.innerWidth - rect.right),
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

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
        title="Thao tác khác"
      >
        {trigger || <MoreVertical className="h-4 w-4" />}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.openUp ? 'auto' : `${coords.top}px`,
              bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : 'auto',
              right: `${coords.right}px`,
            }}
            className="z-[9999] w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl text-xs font-bold text-slate-700 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            {children(() => setIsOpen(false))}
          </div>,
          document.body
        )}
    </>
  );
};
