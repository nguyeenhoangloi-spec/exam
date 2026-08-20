'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Lock, Sliders, Maximize2, Minimize2, X } from 'lucide-react';

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
  maxPlays = 2,
  mode,
  fileName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLMediaElement | HTMLVideoElement | HTMLAudioElement | any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playsCount, setPlaysCount] = useState<number>(0);
  const [hasStartedCurrentPlay, setHasStartedCurrentPlay] = useState(false);
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);

  // Xác định chế độ: nếu mode được truyền hoặc nếu maxPlays > 0 thì là STRICT_EXAM, ngược lại REFERENCE
  const isStrictExam = mode === 'STRICT_EXAM' || (mode === undefined && maxPlays > 0);
  const isUnlimited = !isStrictExam || maxPlays <= 0;
  const isLimitReached = !isUnlimited && playsCount >= maxPlays;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Giữ trạng thái phát và thời gian liền mạch khi bật/tắt phóng to
  useEffect(() => {
    if (mediaRef.current && currentTime > 0) {
      try {
        if (Math.abs(mediaRef.current.currentTime - currentTime) > 0.5) {
          mediaRef.current.currentTime = currentTime;
        }
        if (isPlaying) {
          mediaRef.current.play().catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTheaterFullscreen]);

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

  // Lắng nghe phím Esc để thu nhỏ khi đang ở chế độ xem toàn màn hình
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterFullscreen) {
        setIsTheaterFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterFullscreen]);

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-1">
      {/* Khảo thí: Chỉ hiển thị bộ đếm lượt tinh gọn phẳng, không dùng viền/hộp nặng */}
      {isStrictExam && (
        <div className="flex items-center justify-between text-type-helper px-0.5 pb-0.5">
          <span className="text-slate-500 font-medium">
            {type === 'video' ? 'Video đề thi' : 'Audio đề thi'}
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isLimitReached ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isLimitReached ? (
              <>
                <Lock className="h-3.5 w-3.5 text-rose-500" />
                <span>Đã hết lượt ({playsCount}/{maxPlays})</span>
              </>
            ) : (
              <>
                <span className="text-slate-400">Số lượt:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {playsCount}/{maxPlays}
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Media Playback Viewport */}
      {type === 'video' ? (
        <>
          {/* Inline Video Container */}
          <div className="relative group w-full overflow-hidden rounded-xl bg-black">
            <div className="relative w-full">
              <video
                ref={!isTheaterFullscreen ? mediaRef : undefined}
                src={src}
                playsInline
                preload="metadata"
                onClick={handlePlayPause}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-72 w-full object-contain cursor-pointer bg-black"
              />

              {/* Nút phóng to video ở góc trên bên phải khi ở chế độ inline (Pure Ghost Icon) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTheaterFullscreen(true);
                }}
                className="absolute top-2.5 right-2.5 z-20 flex items-center justify-center p-1 text-white/85 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:scale-115 active:scale-95 transition cursor-pointer"
                title="Phóng to xem video"
              >
                <Maximize2 className="h-4.5 w-4.5" />
              </button>

              {/* Nút Play trung tâm khi tạm dừng (Inline) */}
              {!isPlaying && !isLimitReached && (
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition cursor-pointer"
                  title="Phát video"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform duration-150 group-hover:scale-110 active:scale-95">
                    <Play className="h-6 w-6 ml-0.5 fill-white text-white" />
                  </div>
                </button>
              )}

              {/* Màn hình khóa khi hết lượt nghe (Khảo thí) */}
              {isLimitReached && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 p-4 text-center backdrop-blur-xs">
                  <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <p className="text-type-helper font-semibold text-white">Đã hết số lần phát ({maxPlays} lần)</p>
                  <p className="text-type-helper text-slate-400 mt-0.5">Đã khóa nút phát theo quy định của đề thi.</p>
                </div>
              )}
            </div>

            {/* Thanh điều khiển Inline (Ghost Controls) */}
            <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white">
              <button
                type="button"
                onClick={handlePlayPause}
                disabled={isLimitReached}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                title={isPlaying ? 'Tạm dừng' : 'Phát video'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </button>

              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-type-helper text-slate-300 tabular-nums shrink-0 font-medium">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={isStrictExam || isLimitReached}
                  className={`flex-1 h-1 rounded-full appearance-none cursor-pointer ${
                    isStrictExam
                      ? 'bg-white/20 accent-white/50 cursor-not-allowed'
                      : 'bg-white/20 hover:bg-white/30 accent-blue-500'
                  }`}
                />
                <span className="text-type-helper text-slate-400 tabular-nums shrink-0 font-medium">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTheaterFullscreen(true);
                  }}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Phóng to xem video"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lightbox Modal Phóng to chuẩn 1:1 như ImageLightboxModal */}
          {isTheaterFullscreen && (
            <div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Xem video phóng to"
              className="ui-dark-surface fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 transition-all animate-fade-in"
              onClick={() => setIsTheaterFullscreen(false)}
            >
              {/* Badge số lượt phát (Khảo thí) - Góc trên bên trái tinh gọn */}
              {isStrictExam && (
                <div
                  className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 text-white shadow-xl backdrop-blur-md text-type-helper font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-slate-400">Lượt phát:</span>
                  <span className="font-semibold text-white">{playsCount}/{maxPlays}</span>
                </div>
              )}

              {/* Control Bar Top-Right - Đồng bộ chuẩn 1:1 với ImageLightboxModal */}
              <div
                className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-2xl bg-slate-900/80 p-2 text-white shadow-xl backdrop-blur-md"
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
                <div className="h-5 w-px bg-slate-700/60 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setIsTheaterFullscreen(false)}
                  title="Đóng (Esc)"
                  className="rounded-xl bg-rose-600/80 p-2 text-white hover:bg-rose-600 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main Video Box Trung tâm */}
              <div
                className="relative max-h-[85vh] max-w-[90vw] flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl bg-black"
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  ref={mediaRef}
                  src={src}
                  playsInline
                  autoPlay
                  preload="metadata"
                  onClick={handlePlayPause}
                  onEnded={handleEnded}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-[75vh] max-w-[85vw] object-contain rounded-2xl cursor-pointer bg-black"
                />

                {/* Nút Play trung tâm khi tạm dừng (Lightbox) */}
                {!isPlaying && !isLimitReached && (
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition cursor-pointer"
                    title="Phát video"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform duration-150 hover:scale-110 active:scale-95">
                      <Play className="h-7 w-7 ml-0.5 fill-white text-white" />
                    </div>
                  </button>
                )}

                {/* Màn hình khóa khi hết lượt nghe (Khảo thí) */}
                {isLimitReached && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 p-4 text-center backdrop-blur-xs">
                    <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <p className="text-type-helper font-semibold text-white">Đã hết số lần phát ({maxPlays} lần)</p>
                    <p className="text-type-helper text-slate-400 mt-0.5">Đã khóa nút phát theo quy định của đề thi.</p>
                  </div>
                )}

                {/* Thanh điều khiển dưới (Ghost Controls) */}
                <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white absolute bottom-0 left-0 right-0 z-10">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    disabled={isLimitReached}
                    className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer disabled:opacity-40"
                    title={isPlaying ? 'Tạm dừng' : 'Phát video'}
                  >
                    {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-current" />}
                  </button>

                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-type-helper text-slate-200 tabular-nums shrink-0 font-medium">
                      {formatTime(currentTime)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      disabled={isStrictExam || isLimitReached}
                      className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer ${
                        isStrictExam
                          ? 'bg-white/20 accent-white/50 cursor-not-allowed'
                          : 'bg-white/20 hover:bg-white/30 accent-blue-500'
                      }`}
                    />
                    <span className="text-type-helper text-slate-300 tabular-nums shrink-0 font-medium">
                      {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition cursor-pointer"
                      title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
                    >
                      {isMuted ? <VolumeX className="h-4.5 w-4.5 text-rose-400" /> : <Volume2 className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Hint */}
              <div className="absolute bottom-4 text-center text-type-helper text-slate-300 font-medium pointer-events-none">
                Bấm bất kỳ đâu ngoài khung hoặc nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Esc</kbd> để đóng
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative w-full rounded-xl bg-slate-900 dark:bg-slate-950 p-3 text-white overflow-hidden">
          <audio
            ref={mediaRef}
            src={src}
            preload="metadata"
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="hidden"
          />

          {/* Visualizer sóng âm Waveform Animation */}
          <div className="flex items-center justify-center gap-1.5 h-10 my-1">
            {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPlaying ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, height * (isPlaying ? 0.9 : 0.4))}%` : '20%',
                  animationDelay: `${idx * 70}ms`,
                }}
              />
            ))}
          </div>

          {/* Custom Audio Controller - Ghost Buttons */}
          <div className="w-full flex items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={isLimitReached}
              className="p-1 text-white/85 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer disabled:opacity-40"
              title={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            {/* Thanh tiến trình thời gian */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-type-helper text-slate-300 tabular-nums shrink-0 font-medium">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={isStrictExam || isLimitReached}
                className={`flex-1 h-1 rounded-full appearance-none cursor-pointer ${
                  isStrictExam
                    ? 'bg-white/20 accent-white/50 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 accent-blue-500'
                }`}
              />
              <span className="text-type-helper text-slate-400 tabular-nums shrink-0 font-medium">
                {formatTime(duration)}
              </span>
            </div>

            {/* Nút Mute - Ghost */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Màn hình khóa khi hết lượt nghe (Khảo thí) */}
          {isLimitReached && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 p-3 text-center backdrop-blur-xs">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-type-helper font-semibold text-white">Đã hết số lần phát ({maxPlays} lần)</p>
            </div>
          )}
        </div>
      )}

      {/* Tùy chỉnh tốc độ phát khi ở chế độ Tham khảo - Flat Ghost Buttons */}
      {!isStrictExam && (
        <div className="flex items-center justify-end gap-1 pt-0.5 text-type-helper text-slate-500">
          <Sliders className="h-3 w-3 text-slate-400 mr-0.5" />
          <span className="text-type-helper text-slate-400 mr-1">Tốc độ:</span>
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changeRate(rate)}
              className={`px-1.5 py-0.5 text-type-helper font-medium transition cursor-pointer rounded-xl ${
                playbackRate === rate
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

