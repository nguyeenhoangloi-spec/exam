'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Lock, Video, Music, Sparkles, Sliders } from 'lucide-react';

interface QuestionMediaPlayerProps {
  attemptId?: string;
  questionId?: string | number;
  src: string;
  type: 'video' | 'audio';
  fileName?: string;
  maxPlays?: number; // 0 = unlimited (Tham khảo), 1 = 1 play, 2 = 2 plays (Khảo thí)
  mode?: 'STRICT_EXAM' | 'REFERENCE';
}

export const QuestionMediaPlayer: React.FC<QuestionMediaPlayerProps> = ({
  attemptId,
  questionId,
  src,
  type,
  fileName,
  maxPlays = 2,
  mode,
}) => {
  const mediaRef = useRef<HTMLMediaElement | any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playsCount, setPlaysCount] = useState<number>(0);
  const [hasStartedCurrentPlay, setHasStartedCurrentPlay] = useState(false);

  // Xác định chế độ: nếu mode được truyền hoặc nếu maxPlays > 0 thì là STRICT_EXAM, ngược lại REFERENCE
  const isStrictExam = mode === 'STRICT_EXAM' || (mode === undefined && maxPlays > 0);
  const isUnlimited = !isStrictExam || maxPlays <= 0;
  const isLimitReached = !isUnlimited && playsCount >= maxPlays;

  // Unique storage key để chống F5 gian lận số lần nghe
  const storageKey = attemptId && (questionId || src)
    ? `exam_media_plays_${attemptId}_${questionId || encodeURIComponent(src)}`
    : null;

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPlaysCount(parseInt(saved, 10) || 0);
      }
    }
  }, [storageKey]);

  const handlePlayPause = () => {
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isLimitReached) return;
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

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isStrictExam) return; // Khóa tua trong chế độ khảo thí chuẩn hóa
    const target = parseFloat(e.target.value);
    if (mediaRef.current && !isNaN(target)) {
      mediaRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const changeRate = (rate: number) => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:shadow-md">
      {/* Header Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          {type === 'video' ? (
            <Video className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          ) : (
            <Music className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          )}
          <span className="truncate text-type-helper font-semibold text-slate-800 dark:text-slate-200">
            {fileName || (type === 'video' ? 'Video câu hỏi' : 'Audio bài nghe')}
          </span>
        </div>

        {/* Chế độ & Bộ đếm (Chỉ hiển thị khi ở chế độ Khảo thí) */}
        {isStrictExam && (
          <div className="flex items-center gap-1.5">
            <span
              className={`ui-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-type-helper font-medium border ${
                isLimitReached
                  ? 'text-rose-700 border-rose-300 dark:text-rose-300 dark:border-rose-700 bg-rose-50/40'
                  : 'text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700 bg-blue-50/30'
              }`}
            >
              {isLimitReached ? (
                <>
                  <Lock className="h-3 w-3" /> Hết lượt ({playsCount}/{maxPlays})
                </>
              ) : (
                <>
                  <span>Khảo thí:</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">{playsCount}/{maxPlays} lượt</span>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Media Playback Viewport */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950 p-1">
        {type === 'video' ? (
          <video
            ref={mediaRef}
            src={src}
            controls={!isStrictExam && !isLimitReached}
            controlsList={isStrictExam ? 'nodownload noplaybackrate' : 'nodownload'}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-60 w-full rounded-xl object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 text-white">
            <audio
              ref={mediaRef}
              src={src}
              onEnded={handleEnded}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="hidden"
            />

            {/* Visualizer sóng âm Waveform Animation */}
            <div className="flex items-center justify-center gap-1.5 h-12 my-2">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85].map((height, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlaying
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (height * (isPlaying ? 0.9 : 0.4)))}%` : '20%',
                    animationDelay: `${idx * 70}ms`,
                  }}
                />
              ))}
            </div>

            {/* Custom Audio Controller */}
            <div className="w-full flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={isLimitReached}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition cursor-pointer shadow-md ${
                  isLimitReached
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
                }`}
                title={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>

              {/* Thanh tiến trình thời gian */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between text-type-helper text-slate-300 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={isStrictExam || isLimitReached}
                  className={`w-full h-1.5 rounded-xl appearance-none cursor-pointer ${
                    isStrictExam
                      ? 'bg-slate-800 accent-slate-600 cursor-not-allowed'
                      : 'bg-slate-700 accent-blue-500'
                  }`}
                />
              </div>

              {/* Nút Mute */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Màn hình khóa khi hết lượt nghe (Khảo thí) */}
        {isLimitReached && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/85 p-4 text-center backdrop-blur-xs">
            <div className="mb-2 rounded-full bg-rose-500/20 p-2.5 border border-rose-500/40">
              <Lock className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-type-helper font-semibold text-white">Đã hết số lần phát cho phép ({maxPlays} lần)</p>
            <p className="mt-1 text-type-helper text-slate-400">Bạn đã phát đủ số lần nghe theo quy chế của câu hỏi này.</p>
          </div>
        )}
      </div>

      {/* Speed Controls for Reference Mode & Policy Note */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-type-helper text-slate-600 dark:text-slate-300">
        <span>
          {isStrictExam ? (
            !isLimitReached
              ? `Khảo thí chuẩn hóa: Khóa tua, còn ${maxPlays - playsCount} lần nghe.`
              : 'Đã khóa nút phát theo quy định.'
          ) : (
            'Tham khảo tự do: Được tua và nghe lại không giới hạn.'
          )}
        </span>

        {/* Tùy chỉnh tốc độ phát khi ở chế độ Tham khảo */}
        {!isStrictExam && (
          <div className="flex items-center gap-1">
            <Sliders className="h-3 w-3 text-slate-400 mr-1" />
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changeRate(rate)}
                className={`px-2 py-0.5 rounded-xl text-type-helper font-medium transition cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
