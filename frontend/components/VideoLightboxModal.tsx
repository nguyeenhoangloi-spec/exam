'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minimize2, X } from 'lucide-react';
import { getImageUrl } from '../lib/media-utils';

interface VideoLightboxModalProps {
  videoUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

export const VideoLightboxModal: React.FC<VideoLightboxModalProps> = ({ videoUrl, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
    const handleFullscreenChange = () => { setIsFullscreen(Boolean(document.fullscreenElement)); };

    window.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  if (!videoUrl) return null;

  const fullUrl = getImageUrl(videoUrl);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {});
      } else if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Trình phát video"
      className="ui-dark-surface fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar controls - Thuần icon tinh tế, không khung viền hộp */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-1 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          className="p-2 text-white/80 hover:text-white drop-shadow-md hover:scale-110 active:scale-95 transition cursor-pointer rounded-xl"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5 text-blue-400" /> : <Maximize2 className="h-5 w-5" />}
        </button>

        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          title="Tải video"
          className="p-2 text-white/80 hover:text-white drop-shadow-md hover:scale-110 active:scale-95 transition rounded-xl"
        >
          <Download className="h-5 w-5" />
        </a>

        <button
          type="button"
          onClick={onClose}
          title="Đóng (Esc)"
          className="p-2 text-white/80 hover:text-rose-400 drop-shadow-md hover:scale-110 active:scale-95 transition cursor-pointer rounded-xl"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Video Container */}
      <div
        className="relative max-h-[85vh] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={fullUrl}
          controls
          autoPlay
          className="max-h-[85vh] max-w-[90vw] bg-black rounded-2xl"
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 text-center text-type-helper text-slate-400 font-medium pointer-events-none">
        Bấm ngoài khung hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd> để đóng
      </div>
    </div>
  );
};
