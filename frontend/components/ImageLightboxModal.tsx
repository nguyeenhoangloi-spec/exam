'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minimize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getImageUrl } from '../lib/media-utils';
import { DynamicImage } from './ui/DynamicImage';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  altText?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  altText = 'Hình ảnh câu hỏi',
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  if (!imageUrl) return null;

  const fullUrl = getImageUrl(imageUrl);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 transition-all animate-fade-in"
      onClick={onClose}
    >
      {/* Control Bar Top - Bỏ toàn bộ chữ, chỉ giữ icon điều khiển */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-2xl bg-slate-900/80 p-2 text-white shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5 text-blue-400" /> : <Maximize2 className="h-5 w-5 text-blue-400" />}
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          title="Phóng to (+)"
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Thu nhỏ (-)"
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="Đặt lại kích thước gốc (100%)"
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          title="Tải ảnh về máy"
          className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <Download className="h-5 w-5" />
        </a>
        <div className="h-5 w-px bg-slate-700/60 mx-1" />
        <button
          type="button"
          onClick={onClose}
          title="Đóng (Esc)"
          className="rounded-xl bg-rose-600/80 p-2 text-white hover:bg-rose-600 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-h-[85vh] max-w-[90vw] overflow-auto flex items-center justify-center p-2 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <DynamicImage
          src={fullUrl}
          alt={altText}
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
          className="max-h-[80vh] max-w-[85vw] rounded-xl object-contain shadow-2xl bg-slate-900"
        />
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 text-center text-xs text-slate-300 font-medium pointer-events-none">
        Bấm bất kỳ đâu ngoài khung hoặc nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd> để đóng
      </div>
    </div>
  );
};
