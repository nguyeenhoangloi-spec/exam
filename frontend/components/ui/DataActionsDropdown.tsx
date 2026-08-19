'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  FileSpreadsheet,
  FileUp,
  Printer,
  Upload,
} from 'lucide-react';

export interface DataActionsDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface DataActionsDropdownProps {
  onExport?: () => void;
  onExportExcel?: () => void;
  onExportAll?: () => void;
  exportLabel?: string;
  onImport?: () => void;
  importLabel?: string;
  onPrint?: () => void;
  onPrintAll?: () => void;
  onPrintReport?: () => void;
  printLabel?: string;
  onDownloadTemplate?: () => void;
  customItems?: DataActionsDropdownItem[];
  className?: string;
}

export function DataActionsDropdown({
  onExport,
  onExportExcel,
  onExportAll,
  exportLabel = 'Xuất Excel',
  onImport,
  importLabel = 'Nhập dữ liệu',
  onPrint,
  onPrintAll,
  onPrintReport,
  printLabel = 'In báo cáo',
  onDownloadTemplate,
  customItems = [],
  className = '',
}: DataActionsDropdownProps) {
  const handleExport = onExport || onExportExcel || onExportAll;
  const handlePrint = onPrint || onPrintAll || onPrintReport;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasAnyAction = Boolean(
    handleExport || onImport || handlePrint || onDownloadTemplate || customItems.length > 0
  );

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const minWidth = 200;
    const estimatedHeight = 120;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estimatedHeight + 10 && rect.top > estimatedHeight;
    const top = openUpward ? Math.max(10, rect.top - estimatedHeight - 6) : rect.bottom + 6;

    let left = rect.right - minWidth;
    if (left < 16) left = 16;

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      minWidth: `${minWidth}px`,
      maxWidth: '240px',
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!hasAnyAction) return null;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Tùy chọn xuất nhập dữ liệu"
        title="Tùy chọn xuất nhập dữ liệu"
        onClick={() => setIsOpen(!isOpen)}
        className={`ui-pressable h-10 w-10 flex items-center justify-center rounded-xl text-type-body font-medium outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-all duration-150 cursor-pointer select-none ${isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
          }`}
      >
        <Upload className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            role="menu"
            className="w-max rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <div className="space-y-0.5">
              {handleExport && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleExport();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer select-none text-left"
                >
                  <FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>{exportLabel}</span>
                </button>
              )}

              {onImport && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onImport();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer select-none text-left"
                >
                  <FileUp className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>{importLabel}</span>
                </button>
              )}

              {onDownloadTemplate && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDownloadTemplate();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer select-none text-left"
                >
                  <Download className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>Tải file mẫu</span>
                </button>
              )}

              {handlePrint && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handlePrint();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer select-none text-left"
                >
                  <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>{printLabel}</span>
                </button>
              )}

              {customItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-type-body-sm font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150 cursor-pointer select-none text-left"
                >
                  {item.icon || <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={1.5} />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
