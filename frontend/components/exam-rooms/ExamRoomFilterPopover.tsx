'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  Check,
  Building,
  Monitor,
  Zap,
  Filter,
  CheckCheck,
  DoorOpen,
  Users,
} from 'lucide-react';
import { ExamRoom } from '../../types';

interface ExamRoomFilterPopoverProps {
  selectedType: string;
  onTypeChange: (val: string) => void;
  selectedBuilding: string;
  onBuildingChange: (val: string) => void;
  selectedCapacityRange?: string;
  onCapacityRangeChange?: (val: string) => void;
  buildingList: string[];
  rooms?: ExamRoom[];
  totalFilteredCount?: number;
  onResetAll: () => void;
}

type FilterCategory = 'presets' | 'type' | 'building' | 'capacity';

export function ExamRoomFilterPopover({
  selectedType,
  onTypeChange,
  selectedBuilding,
  onBuildingChange,
  selectedCapacityRange = '',
  onCapacityRangeChange,
  buildingList,
  rooms = [],
  totalFilteredCount,
  onResetAll,
}: ExamRoomFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('presets');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tính toán số lượng thực tế
  const optionCounts = useMemo(() => {
    const total = rooms.length;
    const labCount = rooms.filter((r) => r.roomType === 'COMPUTER_LAB').length;
    const theoryCount = rooms.filter((r) => r.roomType === 'THEORY' || r.roomType === 'THEORY_ROOM' || r.roomType !== 'COMPUTER_LAB').length;

    const buildingCounts: Record<string, number> = {};
    buildingList.forEach((b) => {
      buildingCounts[b] = rooms.filter((r) => (r.building || r.location) === b).length;
    });

    const capUnder30 = rooms.filter((r) => (r.capacity || 40) < 30).length;
    const cap30to50 = rooms.filter((r) => (r.capacity || 40) >= 30 && (r.capacity || 40) <= 50).length;
    const capOver50 = rooms.filter((r) => (r.capacity || 40) > 50).length;

    return { total, labCount, theoryCount, buildingCounts, capUnder30, cap30to50, capOver50 };
  }, [rooms, buildingList]);

  const activeFilterCount = [
    Boolean(selectedType),
    Boolean(selectedBuilding),
    Boolean(selectedCapacityRange),
  ].filter(Boolean).length;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    const popoverWidth = Math.min(480, vw - margin * 2);
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const preferUpward = spaceBelow < 260 && spaceAbove > spaceBelow;

    let top: number;
    let availableMaxHeight: number;

    if (preferUpward) {
      availableMaxHeight = Math.min(460, spaceAbove - 8);
      top = Math.max(margin, rect.top - availableMaxHeight - 8);
    } else {
      top = rect.bottom + 8;
      availableMaxHeight = Math.min(460, spaceBelow - 8);
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
      else if (e.key === '1') setActiveCategory('presets');
      else if (e.key === '2') setActiveCategory('type');
      else if (e.key === '3') setActiveCategory('building');
      else if (e.key === '4') setActiveCategory('capacity');
    };

    const handleResize = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);


  // Đóng popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const categories = [
    { id: 'presets' as FilterCategory, label: 'Lọc nhanh', shortcut: '1', icon: Zap, badge: null },
    { id: 'type' as FilterCategory, label: 'Loại phòng', shortcut: '2', icon: Monitor, badge: selectedType ? '1' : null },
    { id: 'building' as FilterCategory, label: 'Tòa nhà', shortcut: '3', icon: Building, badge: selectedBuilding ? '1' : null },
    { id: 'capacity' as FilterCategory, label: 'Sức chứa', shortcut: '4', icon: Users, badge: selectedCapacityRange ? '1' : null },
  ];

  const typeList = [
    { value: '', label: 'Tất cả loại phòng', desc: 'Mọi phòng thi trong danh mục', count: optionCounts.total },
    { value: 'COMPUTER_LAB', label: 'Phòng máy tính', desc: 'Trang bị máy tính cá nhân', count: optionCounts.labCount },
    { value: 'THEORY', label: 'Phòng lý thuyết', desc: 'Bàn ghế thi viết truyền thống', count: optionCounts.theoryCount },
  ];

  const capacityList = [
    { value: '', label: 'Tất cả sức chứa', desc: 'Mọi quy mô phòng thi', count: optionCounts.total },
    { value: 'under30', label: 'Dưới 30 chỗ', desc: 'Phòng thi nhỏ / chuyên đề', count: optionCounts.capUnder30 },
    { value: '30to50', label: '30 - 50 chỗ', desc: 'Phòng thi chuẩn lớp học', count: optionCounts.cap30to50 },
    { value: 'over50', label: 'Trên 50 chỗ', desc: 'Hội trường / Phòng lớn', count: optionCounts.capOver50 },
  ];

  const applyPreset = (presetType: string) => {
    if (presetType === 'ALL') {
      onResetAll();
    } else if (presetType === 'LAB') {
      onTypeChange('COMPUTER_LAB');
      onBuildingChange('');
      onCapacityRangeChange?.('');
    } else if (presetType === 'THEORY') {
      onTypeChange('THEORY');
      onBuildingChange('');
      onCapacityRangeChange?.('');
    } else if (presetType === 'FIRST_BUILDING') {
      if (buildingList[0]) {
        onBuildingChange(buildingList[0]);
      }
    }
  };

  return (
    <div className="relative inline-block">
      {/* ── Nút kích hoạt Bộ lọc cố định chiều rộng 100% ── */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex h-10 w-[116px] shrink-0 items-center justify-between rounded-xl border px-3 text-xs font-medium transition-all duration-150 cursor-pointer shadow-2xs select-none ${activeFilterCount > 0
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/15 font-semibold'
            : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        title="Mở bảng điều khiển bộ lọc phòng thi"
      >
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal
            className={`h-4 w-4 shrink-0 transition-transform duration-150 ${activeFilterCount > 0
                ? 'text-blue-600 dark:text-blue-400 stroke-[2.3]'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 group-hover:scale-105'
              }`}
          />
          <span>Bộ lọc</span>
        </div>

        {/* Cột phải kích thước cố định: Khi có lọc hiện số đếm (rê chuột đổi thành ✕ để xóa nhanh), khi chưa lọc hiện mũi tên ⌵ */}
        <div className="flex h-5 w-5 items-center justify-center shrink-0">
          {activeFilterCount > 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onResetAll();
              }}
              title="Nhấn để xóa nhanh toàn bộ lọc (1-Click Reset)"
              className="group/badge relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 hover:bg-rose-500 text-[12px] font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <span className="group-hover/badge:hidden">{activeFilterCount}</span>
              <X className="hidden h-3 w-3 group-hover/badge:block stroke-[3]" />
            </div>
          ) : (
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                }`}
            />
          )}
        </div>
      </button>

      {/* ── Bảng Popover 2 Cột Đồng Bộ & Chuẩn Mực Tuyệt Đối ── */}
      {isOpen && mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            role="dialog"
            aria-label="Bảng bộ lọc phòng thi"
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col overflow-hidden"
          >
            {/* 1. Header chuẩn sắc xanh chủ đạo */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                    Bộ lọc phòng thi
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tùy chỉnh tiêu chí hiển thị đồng bộ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onResetAll}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    title="Xóa tất cả bộ lọc đang áp dụng"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại ({activeFilterCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Thân bảng: Bố cục 2 Cột Đồng Bộ Tuyệt Đối */}
            <div className="grid grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Cột Trái (Sidebar Danh mục Tabs) */}
              <div className="col-span-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const IconComp = cat.icon;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer border ${isActive
                          ? 'border-blue-200 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComp className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </div>

                      {cat.badge ? (
                        <span className="h-4 min-w-[16px] rounded-full bg-blue-600 px-1 text-[12px] font-semibold text-white flex items-center justify-center">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className={`text-[12px] font-normal ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {cat.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3 px-2">
                  <div className="text-[12px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <span>Phím:</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-normal text-[12px] text-slate-600 dark:text-slate-400">1-4</kbd>
                  </div>
                </div>
              </div>

              {/* Cột Phải */}
              <div className="col-span-8 p-3 overflow-y-auto custom-scrollbar">
                {/* ── TAB 1: LỌC NHANH (PRESETS) ── */}
                {activeCategory === 'presets' && (
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-medium tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                      Gợi ý bộ lọc phổ biến:
                    </p>

                    <button
                      type="button"
                      onClick={() => applyPreset('LAB')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedType === 'COMPUTER_LAB'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedType === 'COMPUTER_LAB' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Phòng máy tính (Lab)
                        </div>
                        <div className={`text-[12px] truncate ${selectedType === 'COMPUTER_LAB' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Phục vụ các môn thi trắc nghiệm trên máy
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedType === 'COMPUTER_LAB'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.labCount}
                        </span>
                        {selectedType === 'COMPUTER_LAB' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('THEORY')}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedType === 'THEORY'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedType === 'THEORY' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          Phòng lý thuyết
                        </div>
                        <div className={`text-[12px] truncate ${selectedType === 'THEORY' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          Phục vụ thi viết và thi tự luận
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedType === 'THEORY'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                          {optionCounts.theoryCount}
                        </span>
                        {selectedType === 'THEORY' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {buildingList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyPreset('FIRST_BUILDING')}
                        className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer ${selectedBuilding === buildingList[0]
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 shadow-2xs'
                            : 'border-slate-200/70 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                          }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold truncate ${selectedBuilding === buildingList[0] ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            Khu vực {buildingList[0]}
                          </div>
                          <div className={`text-[12px] truncate ${selectedBuilding === buildingList[0] ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            Tòa nhà {buildingList[0]}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedBuilding === buildingList[0]
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                            {optionCounts.buildingCounts[buildingList[0]] || 0}
                          </span>
                          {selectedBuilding === buildingList[0] && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* ── TAB 2: LOẠI PHÒNG ── */}
                {activeCategory === 'type' && (
                  <div className="space-y-1.5">
                    {typeList.map((item) => {
                      const isSelected = selectedType === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onTypeChange(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {item.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 3: TÒA NHÀ ── */}
                {activeCategory === 'building' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => onBuildingChange('')}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${selectedBuilding === ''
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                          : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold ${selectedBuilding === '' ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          Tất cả tòa nhà
                        </div>
                        <div className={`text-[12px] truncate ${selectedBuilding === '' ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          Mọi cơ sở và tòa nhà
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${selectedBuilding === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                          {optionCounts.total}
                        </span>
                        {selectedBuilding === '' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    </button>

                    {buildingList.map((b) => {
                      const isSelected = selectedBuilding === b;
                      const count = optionCounts.buildingCounts[b] ?? 0;

                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => onBuildingChange(b)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              Tòa nhà {b}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              Khu vực {b}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── TAB 4: SỨC CHỨA ── */}
                {activeCategory === 'capacity' && (
                  <div className="space-y-1.5">
                    {capacityList.map((item) => {
                      const isSelected = selectedCapacityRange === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onCapacityRangeChange?.(item.value)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer border ${isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 dark:border-blue-500 shadow-2xs'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                              {item.label}
                            </div>
                            <div className={`text-[12px] truncate ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                              {item.desc}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {item.count}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer tinh gọn & thanh lịch theo sắc xanh hệ thống */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
                  {totalFilteredCount !== undefined ? (
                    <>
                      Khớp <strong className="font-semibold text-blue-600 dark:text-blue-400">{totalFilteredCount}</strong>
                      {rooms.length > 0 && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal"> / {rooms.length} phòng thi ({Math.round((totalFilteredCount / Math.max(1, rooms.length)) * 100)}%)</span>
                      )}
                    </>
                  ) : (
                    'Đã áp dụng bộ lọc'
                  )}
                </div>
                {totalFilteredCount !== undefined && rooms.length > 0 && (
                  <div className="h-1 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((totalFilteredCount / Math.max(1, rooms.length)) * 100))}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Xem kết quả</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
