'use client';

import React, { useEffect, useRef } from 'react';
import { Download, Music, X } from 'lucide-react';
import { getImageUrl } from '../lib/media-utils';

interface AudioLightboxModalProps {
  audioUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

export const AudioLightboxModal: React.FC<AudioLightboxModalProps> = ({ audioUrl, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl]);

  if (!audioUrl) return null;

  const fullUrl = getImageUrl(audioUrl);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar controls - Bỏ viền khung, chỉ gồm nút icon */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-2xl bg-slate-900/80 p-2 text-white shadow-xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          title="Tải âm thanh"
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

      {/* Audio Card Player Container */}
      <div
        className="relative w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Disc / Music Icon */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20">
          <Music className="h-10 w-10 text-white animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-25 pointer-events-none" />
        </div>

        {/* Audio Player */}
        <audio
          ref={audioRef}
          src={fullUrl}
          controls
          autoPlay
          className="w-full h-11 accent-blue-500"
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 text-center text-xs text-slate-300 font-medium pointer-events-none">
        Bấm ngoài khung hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd> để đóng
      </div>
    </div>
  );
};
