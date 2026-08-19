'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Lock, CheckCircle, Video, Music } from 'lucide-react';

interface QuestionMediaPlayerProps {
  attemptId?: string;
  questionId?: string | number;
  src: string;
  type: 'video' | 'audio';
  fileName?: string;
  maxPlays?: number; // 0 = unlimited, 1 = 1 play, 2 = 2 plays, etc.
}

export const QuestionMediaPlayer: React.FC<QuestionMediaPlayerProps> = ({
  attemptId,
  questionId,
  src,
  type,
  fileName,
  maxPlays = 2, // Default: max 2 plays for listening/video exam questions
}) => {
  const mediaRef = useRef<HTMLMediaElement | any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playsCount, setPlaysCount] = useState<number>(0);
  const [hasStartedCurrentPlay, setHasStartedCurrentPlay] = useState(false);

  // Unique storage key to prevent cheating via page reload
  const storageKey = attemptId && (questionId || src)
    ? `exam_media_plays_${attemptId}_${questionId || encodeURIComponent(src)}`
    : null;

  // Load saved play count on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPlaysCount(parseInt(saved, 10) || 0);
      }
    }
  }, [storageKey]);

  const isUnlimited = maxPlays <= 0;
  const isLimitReached = !isUnlimited && playsCount >= maxPlays;

  const handlePlayPause = () => {
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isLimitReached) return;

      // Start playing
      const playPromise = mediaRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (!hasStartedCurrentPlay) {
              setHasStartedCurrentPlay(true);
            }
          })
          .catch((err: any) => {
            console.error('Lỗi phát media:', err);
          });
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasStartedCurrentPlay(false);

    if (!isUnlimited) {
      const nextCount = playsCount + 1;
      setPlaysCount(nextCount);

      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, String(nextCount));
      }
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Header Info Bar */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          {type === 'video' ? (
            <Video className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          ) : (
            <Music className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="truncate text-type-helper font-semibold text-slate-700 dark:text-slate-200">
            {fileName || (type === 'video' ? 'Video câu hỏi' : 'Audio bài nghe')}
          </span>
        </div>

        {/* Play Counter Badge */}
        {!isUnlimited ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-type-helper font-semibold ${
              isLimitReached
                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
            }`}
          >
            {isLimitReached ? (
              <>
                <Lock className="h-3 w-3" /> Đã hết lượt xem ({playsCount}/{maxPlays})
              </>
            ) : (
              <>
                Lượt xem: <span className="font-semibold text-blue-900 dark:text-blue-100">{playsCount}/{maxPlays}</span>
              </>
            )}
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-type-helper font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Không giới hạn
          </span>
        )}
      </div>

      {/* Media Content Area */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950">
        {type === 'video' ? (
          <video
            ref={mediaRef}
            src={src}
            controls={!isLimitReached}
            controlsList="nodownload noplaybackrate"
            onEnded={handleEnded}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-60 w-full rounded-xl object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <audio
              ref={mediaRef}
              src={src}
              controls={!isLimitReached}
              controlsList="nodownload noplaybackrate"
              onEnded={handleEnded}
              className="w-full"
            />
          </div>
        )}

        {/* Overlaid Lock Overlay when Limit is Reached */}
        {isLimitReached && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 p-4 text-center backdrop-blur-xs">
            <div className="mb-2 rounded-full bg-rose-500/20 p-2.5 border border-rose-500/40">
              <Lock className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-type-helper font-semibold text-white">Đã hết số lần phát cho phép ({maxPlays} lần)</p>
            <p className="mt-1 text-type-helper text-slate-400">Bạn đã phát đủ số lần nghe cho câu hỏi này.</p>
          </div>
        )}
      </div>

      {/* Footer Helper Note */}
      <div className="mt-2.5 flex items-center justify-between text-type-helper text-slate-600 dark:text-slate-300">
        <span>
          {!isUnlimited && !isLimitReached
            ? `⚠️ Bạn còn lại ${maxPlays - playsCount} lần nghe.`
            : isLimitReached
            ? '🔒 Đã khóa nút phát.'
            : '▶️ Bạn có thể nghe lại bài thi này.'}
        </span>
      </div>
    </div>
  );
};
