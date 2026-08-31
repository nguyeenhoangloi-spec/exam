'use client';

import React, { useId, useMemo } from 'react';
import type { KPIColor } from '../KPICards';

export interface SparklineWaveProps {
  data?: number[];
  color?: KPIColor;
  height?: number;
  className?: string;
  showDot?: boolean;
}

const colorClassMap: Record<KPIColor, string> = {
  blue: 'text-blue-600 dark:text-blue-400',
  sky: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-slate-600 dark:text-slate-400',
};

/**
 * Tạo đường cong Bezier mềm mại (Cubic Spline) từ tập hợp các điểm
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

/**
 * Subtle Area Wave Sparkline - Biểu đồ diện tích sóng chìm thẩm mỹ cao cho thẻ KPI
 */
export function SparklineWave({
  data,
  color = 'blue',
  height = 44,
  className = '',
  showDot = true,
}: SparklineWaveProps) {
  const gradientId = useId();

  // Chuẩn hóa dữ liệu: Nếu không có mảng data, tạo chuỗi sóng nhịp điệu sinh động
  const series = useMemo(() => {
    if (data && data.length >= 2) return data;
    if (data && data.length === 1) return [data[0] * 0.8, data[0] * 0.9, data[0]];
    // Fallback: Sóng organic nhịp nhàng
    return [24, 28, 22, 35, 30, 42, 38, 48];
  }, [data]);

  const { pathD, areaD, lastPoint } = useMemo(() => {
    const width = 120;
    const paddingY = 6;
    const availableHeight = height - paddingY * 2;

    const minVal = Math.min(...series);
    const maxVal = Math.max(...series);
    const delta = maxVal - minVal || 1;

    const points = series.map((val, idx) => {
      const x = (idx / (series.length - 1)) * width;
      const normalized = (val - minVal) / delta;
      // Trục Y của SVG đếm từ trên xuống
      const y = height - paddingY - normalized * availableHeight;
      return { x, y };
    });

    const linePath = createSmoothPath(points);
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
    const last = points[points.length - 1];

    return { pathD: linePath, areaD: areaPath, lastPoint: last };
  }, [series, height]);

  const themeClass = colorClassMap[color] || colorClassMap.blue;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 w-full overflow-hidden rounded-b-2xl transition-all duration-300 ${className}`}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 120 ${height}`}
        preserveAspectRatio="none"
        className={`h-full w-full overflow-visible ${themeClass}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Diện tích chìm (Area Fill) */}
        <path
          d={areaD}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300"
        />

        {/* 2. Đường sóng đỉnh (Stroke Line) */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.35"
          className="transition-all duration-300 group-hover:[stroke-opacity:0.85]"
        />

        {/* 3. Điểm chốt dữ liệu (Endpoint Pulse Dot) */}
        {showDot && lastPoint && (
          <g className="transition-transform duration-300 group-hover:scale-110">
            {/* Outer halo */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3.5"
              fill="currentColor"
              fillOpacity="0.18"
              className="animate-pulse"
            />

            {/* Inner solid dot */}
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="1.75"
              fill="currentColor"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
