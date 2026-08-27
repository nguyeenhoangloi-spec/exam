'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, ChevronDown, Check, Search, X, Users } from 'lucide-react';

export type ScheduleClassItem = {
  id: number;
  name: string;
  code: string;
  departmentId?: number;
  departmentName?: string;
  studentCount: number;
};

interface ClassSelectorPopoverProps {
  classes: ScheduleClassItem[];
  selectedClassIds: number[];
  onChange: (ids: number[]) => void;
}

export function ClassSelectorPopover({
  classes,
  selectedClassIds,
  onChange,
}: ClassSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const totalClasses = classes.length;
  const isAllSelected = totalClasses > 0 && selectedClassIds.length === totalClasses;
  const isPartiallySelected = selectedClassIds.length > 0 && selectedClassIds.length < totalClasses;

  const totalStudents = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.id)).reduce((sum, c) => sum + c.studentCount, 0),
    [classes, selectedClassIds]
  );

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase().trim();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.departmentName && c.departmentName.toLowerCase().includes(q))
    );
  }, [classes, searchQuery]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(380, vw - margin * 2);
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const preferUpward = spaceBelow < 320 && spaceAbove > spaceBelow;

    let top: number;
    let availableMaxHeight: number;

    if (preferUpward) {
      availableMaxHeight = Math.min(420, spaceAbove - 8);
      top = Math.max(margin, rect.top - availableMaxHeight - 8);
    } else {
      top = rect.bottom + 8;
      availableMaxHeight = Math.min(420, spaceBelow - 8);
    }

    let left = rect.left;
    if (left + popoverWidth > vw - margin) {
      left = Math.max(margin, vw - popoverWidth - margin);
    }
    if (left < margin) {
      left = margin;
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${Math.max(margin, top)}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      maxHeight: `${Math.max(280, availableMaxHeight)}px`,
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleClass = (id: number) => {
    if (selectedClassIds.includes(id)) {
      onChange(selectedClassIds.filter((item) => item !== id));
    } else {
      onChange([...selectedClassIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(classes.map((c) => c.id));
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* ── Nút kích hoạt Dropdown tinh gọn ── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 px-3.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none text-type-helper font-medium ${
          isOpen
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-2xs'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 shadow-2xs'
        }`}
        title="Chọn các lớp học phần tham gia thi"
      >
        <span className="truncate max-w-[170px] sm:max-w-[210px]">
          {selectedClassIds.length === 0
            ? 'Chọn lớp'
            : isAllSelected
              ? `${totalClasses} Lớp (${totalStudents} SV)`
              : `${selectedClassIds.length}/${totalClasses} Lớp (${totalStudents} SV)`}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Popover Bảng Chọn Lớp ── */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-type-helper font-semibold text-slate-900 dark:text-slate-100">
                    Lớp học phần tham gia thi
                  </h4>
                  <p className="text-type-helper text-slate-500 dark:text-slate-400">
                    Đã chọn {selectedClassIds.length}/{totalClasses} lớp ({totalStudents} SV)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm lớp..."
                  className="w-full h-8 pl-7 pr-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-type-body text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
                <Search className="h-3 w-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-xl cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Select All Row */}
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-type-body font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleToggleAll}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
                <span>Chọn tất cả ({totalClasses} lớp)</span>
              </label>
              <span className="text-type-helper text-slate-400 font-normal">
                {classes.reduce((sum, c) => sum + c.studentCount, 0)} SV tổng
              </span>
            </div>

            {/* Class List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 max-h-[220px]">
              {filteredClasses.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-type-helper">
                  Không tìm thấy lớp học phần phù hợp
                </div>
              ) : (
                filteredClasses.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleToggleClass(cls.id)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition cursor-pointer select-none border ${
                        isChecked
                          ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer shrink-0 pointer-events-none"
                        />
                        <div className="min-w-0">
                          <p className="text-type-helper font-semibold truncate leading-tight">
                            {cls.name}
                          </p>
                          {cls.departmentName && (
                            <p className="text-type-helper text-slate-400 dark:text-slate-500 truncate leading-tight">
                              {cls.departmentName}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-type-helper font-medium px-2 py-0.5 ui-pill rounded-full shrink-0 ${
                          isChecked
                            ? 'ui-pill-solid bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cls.studentCount} SV
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
