'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import { getAuthUser, getAuthToken, setAuthToken, getUserAvatar, setUserAvatar } from '../lib/auth';
import { applyTheme, getSavedTheme, ThemeMode } from '../lib/theme';
import { User as UserType } from '../types';
import { Toast } from './Toast';
import { DynamicImage } from './ui/DynamicImage';
import { IdentifierBadge } from './ui/IdentifierBadge';
import {
  User,
  Lock,
  Palette,
  Bell,
  X,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Check,
  Loader2,
  Calendar,
  Volume2,
  KeyRound,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';

export type AccountSettingsTab = 'profile' | 'security' | 'appearance';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AccountSettingsTab;
}

interface ProfileData {
  id: number;
  username: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: string;
  createdAt: string;
  email?: string;
  avatarUrl?: string;
  student?: any;
  teacher?: any;
}

// ── COMPONENT CĂN CHỈNH & THU PHÓNG ẢNH ĐẠI DIỆN (AVATAR CROPPER STUDIO) ──
interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}

function AvatarCropperModal({ isOpen, imageSrc, onClose, onApply }: AvatarCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      draw();
    };
    img.src = imageSrc;
  // The image load should run only when the source changes; draw depends on crop state and would reload the image.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // 280
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x, pan.y);

    const scale = Math.max(220 / img.width, 220 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Dark circular mask overlay
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, 110, 0, Math.PI * 2, true);
    ctx.fill();

    // Guide ring
    ctx.strokeStyle = 'rgb(59, 130, 246)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 110, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }, [zoom, pan, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const outCanvas = document.createElement('canvas');
    const outSize = 256;
    outCanvas.width = outSize;
    outCanvas.height = outSize;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(outSize / 2, outSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const outputScaleFactor = outSize / 220;
    ctx.scale(zoom * outputScaleFactor, zoom * outputScaleFactor);
    ctx.translate(pan.x, pan.y);

    const scale = Math.max(220 / img.width, 220 / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);

    const croppedUrl = outCanvas.toDataURL('image/webp', 0.9);
    onApply(croppedUrl);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="w-full max-w-[360px] sm:max-w-[380px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-apple-modal overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Tinh gọn với Nút Lưu & Nút Đóng */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
            </div>
            <h3 className="text-type-body font-semibold text-slate-900 dark:text-slate-100">
              Căn chỉnh ảnh
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Lưu đặt ngay tại Header chuẩn Apple Editor */}
            <button
              type="button"
              onClick={handleApplyCrop}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-type-body-sm font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Lưu</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas Interactive Crop Viewport */}
        <div className="p-5 flex flex-col items-center bg-slate-50/40 dark:bg-slate-950/40 select-none">
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 dark:border-slate-800 touch-none"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas ref={canvasRef} width={260} height={260} className="block" />
          </div>

          <p className="text-type-helper text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Kéo để di chuyển góc ảnh mong muốn
          </p>
        </div>

        {/* Controls: Zoom & Rotate (Tinh gọn 1 khối liền mạch) */}
        <div className="px-5 py-3.5 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Thu nhỏ"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-xl appearance-none"
              />
              <span className="text-type-helper font-medium text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Phóng to"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Utility Buttons: Rotate & Reset */}
          <div className="flex items-center justify-center gap-4 pt-0.5">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Xoay ảnh 90°"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-type-helper font-medium transition cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Xoay 90°</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-type-helper font-medium transition cursor-pointer"
            >
              <span>Đặt lại</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AccountSettingsModal({
  isOpen,
  onClose,
  initialTab = 'profile',
}: AccountSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountSettingsTab>(initialTab);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Profile data state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Avatar Crop State
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Form profile state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Appearance state
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [compactTable, setCompactTable] = useState(false);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load theme preference on mount
  useEffect(() => {
    try {
      setThemeMode(getSavedTheme());

      const savedCompact = localStorage.getItem('table_compact') === 'true';
      setCompactTable(savedCompact);
    } catch {
      // ignore localStorage errors
    }
  }, []);



  // Helper: Tạo PNG Canvas avatar chữ viết tắt theo màu gradient (Sắc nét 100%, không bị lỗi hiển thị)
  const generateCanvasMonogram = (text: string, fromColor: string, toColor: string): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 256, 56);
    ctx.fill();

    // Monogram text
    const cleanText = (text || 'AD').trim().slice(0, 2).toUpperCase();
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.font = '600 105px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillText(cleanText, 128, 134);

    return canvas.toDataURL('image/png');
  };

  // Helper: Tạo PNG Canvas avatar biểu tượng theo chủ đề (Hiển thị icon to đẹp, không bị trơn màu)
  const generateCanvasIcon = (emojiOrText: string, fromColor: string, toColor: string): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 256, 56);
    ctx.fill();

    // Draw Emoji icon
    ctx.font = '105px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillText(emojiOrText, 128, 138);

    return canvas.toDataURL('image/png');
  };

  // Fetch Profile data when modal opens
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile');
      const data = res.data;
      setProfile(data);

      const currentAvatar = getUserAvatar(data) || data.avatarUrl || data.teacher?.avatarUrl || data.student?.avatarUrl || '';
      setAvatarUrl(currentAvatar);

      const name = data.teacher?.fullName || data.student?.fullName || data.username || 'Admin';
      setFullName(name);
      setEmail(data.email || `${data.username}@exam.edu.vn`);
      setPhone(data.teacher?.phone || data.student?.phone || '');
      setAddress(data.teacher?.address || data.student?.address || '');
    } catch (err: any) {
      const u = getAuthUser();
      if (u) {
        setProfile({
          id: u.id || 1,
          username: u.username || 'user',
          role: u.role || 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatarUrl: u.avatarUrl,
          student: u.student || null,
          teacher: u.teacher || null,
        });
        const currentAvatar = getUserAvatar(u) || u.avatarUrl || '';
        setAvatarUrl(currentAvatar);
        const name = u.teacher?.fullName || u.student?.fullName || u.username || 'Admin';
        setFullName(name);
        setEmail(u.email || `${u.username || 'user'}@exam.edu.vn`);
        setPhone(u.teacher?.phone || u.student?.phone || '');
        setAddress('');
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCropperOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isCropperOpen]);

  // Auto-Save Profile Function
  const autoSaveProfile = useCallback(
    async (updatedFields: { fullName?: string; email?: string; phone?: string; address?: string; avatarUrl?: string }) => {
      setSaveStatus('saving');
      try {
        const payload = {
          fullName: (updatedFields.fullName !== undefined ? updatedFields.fullName : fullName).trim(),
          email: (updatedFields.email !== undefined ? updatedFields.email : email).trim(),
          phone: (updatedFields.phone !== undefined ? updatedFields.phone : phone).trim(),
          avatarUrl: updatedFields.avatarUrl !== undefined ? updatedFields.avatarUrl : avatarUrl,
        };

        if (updatedFields.avatarUrl !== undefined) {
          setUserAvatar(updatedFields.avatarUrl, profile);
        }

        const res = await api.post('/auth/profile', payload);
        const updated = res.data;
        setProfile(updated);

        const token = getAuthToken();
        if (token && updated) {
          const current = getAuthUser();
          setAuthToken(token, {
            ...(current || {}),
            ...updated,
            avatarUrl: payload.avatarUrl || updated.avatarUrl || current?.avatarUrl,
            teacher: updated.teacher ?? current?.teacher,
            student: updated.student ?? current?.student,
          } as UserType);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err: any) {
        setSaveStatus('idle');
        setToast({ message: err?.response?.data?.message || err.message || 'Tự động lưu thất bại', type: 'error' });
      }
    },
    [fullName, email, phone, avatarUrl, profile]
  );

  // Avatar Upload Handler: Mở Cropper Studio để người dùng tự do zoom và căn chỉnh
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)!', type: 'error' });
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setToast({ message: 'Dung lượng ảnh tối đa là 12MB!', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCropImageSrc(dataUrl);
      setIsCropperOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Áp dụng ảnh đã qua cắt & căn chỉnh
  const handleCropperApply = (croppedDataUrl: string) => {
    setIsCropperOpen(false);
    setAvatarUrl(croppedDataUrl);
    setUserAvatar(croppedDataUrl, profile);
    autoSaveProfile({ avatarUrl: croppedDataUrl });
    setToast({ message: 'Đã lưu ảnh đại diện đã căn chỉnh!', type: 'success' });
  };

  const handleApplyCustomAvatar = (dataUri: string, label: string) => {
    setAvatarUrl(dataUri);
    setUserAvatar(dataUri, profile);
    autoSaveProfile({ avatarUrl: dataUri });
    setToast({ message: `Đã áp dụng ảnh đại diện: ${label}`, type: 'success' });
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarUrl('');
    setUserAvatar('', profile);
    autoSaveProfile({ avatarUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setToast({ message: 'Đã gỡ ảnh đại diện về mặc định!', type: 'success' });
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ message: 'Vui lòng điền đầy đủ các trường mật khẩu.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ message: 'Mật khẩu xác nhận không trùng khớp.', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setToast({ message: 'Đổi mật khẩu thành công! Bạn có thể dùng mật khẩu mới từ lần đăng nhập sau.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowConfirm(false);
    } catch (err: any) {
      setToast({ message: err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Password strength meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'Chưa nhập', score: 0, color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Yếu', score: 33, color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
    if (score <= 4) return { label: 'Trung bình', score: 66, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Mạnh', score: 100, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  };
  const strength = getPasswordStrength(newPassword);

  // Apply Theme
  const handleApplyTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    applyTheme(mode, true);
    setToast({
      message: `Đã chuyển sang ${mode === 'dark' ? 'Giao diện Tối' : mode === 'light' ? 'Giao diện Sáng' : 'Giao diện Theo hệ thống'}`,
      type: 'success',
    });
  };

  if (!isOpen || !mounted) return null;

  const displayName = profile?.teacher?.fullName || profile?.student?.fullName || profile?.username || 'Người dùng';
  const roleName = profile?.role === 'ADMIN' ? 'Quản trị viên' : profile?.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên';
  const userCode = profile?.teacher?.teacherCode || profile?.student?.studentCode || `ADM-${String(profile?.id || 1).padStart(4, '0')}`;
  const deptOrClass =
    profile?.teacher?.department?.departmentName ||
    profile?.teacher?.department?.name ||
    profile?.student?.class?.className ||
    profile?.student?.class?.name ||
    'Ban Quản trị Khảo thí';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      {/* Click Outside Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* ════════════════════ PREMIUM 2026 SETTINGS MODAL ════════════════════ */}
      <div className="relative z-10 my-auto flex flex-col md:flex-row w-full max-w-[920px] h-[600px] max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-apple-modal border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">

        {/* ── CỘT DỌC BÊN TRÁI: MINIMALIST FLAT SIDEBAR ── */}
        <aside className="w-full md:w-[270px] shrink-0 h-full bg-slate-50/60 dark:bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-200/70 dark:border-slate-800/80 flex flex-col justify-between p-6 pt-7 overflow-y-auto">
          <div className="space-y-5">
            {/* Header Sidebar: Clean Mini Profile Card */}
            <div className="flex items-center gap-3.5 px-1">
              {avatarUrl ? (
                <DynamicImage
                  src={avatarUrl}
                  alt={displayName}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-semibold text-type-body select-none shadow-2xs shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-type-body font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {displayName}
                </h2>
                <p className="text-type-helper text-slate-500 dark:text-slate-400 truncate">
                  {roleName} ({userCode})
                </p>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-slate-200/90 dark:border-slate-800/60" />

            {/* Flat Minimal Navigation (Không Dùng Nút Viên Thuốc Thô) */}
            <nav className="space-y-1" role="tablist">
              {/* Tab 1: Thông tin cá nhân */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-type-body-sm transition-all text-left cursor-pointer ${activeTab === 'profile'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
              >
                <User className={`h-4.5 w-4.5 shrink-0 transition-colors ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">Hồ sơ cá nhân</span>
              </button>

              {/* Tab 2: Đổi mật khẩu */}
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-type-body-sm transition-all text-left cursor-pointer ${activeTab === 'security'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
              >
                <Lock className={`h-4.5 w-4.5 shrink-0 transition-colors ${activeTab === 'security' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">Mật khẩu & bảo mật</span>
              </button>

              {/* Tab 3: Giao diện */}
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-type-body-sm transition-all text-left cursor-pointer ${activeTab === 'appearance'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
              >
                <Palette className={`h-4.5 w-4.5 shrink-0 transition-colors ${activeTab === 'appearance' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="truncate">Giao diện & hiển thị</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* ── CỘT NỘI DUNG BÊN PHẢI (APPLE BENTO SHEET 2026) ── */}
        <main className="flex-1 min-w-0 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">

          {/* Header Panel Phải Cố định (Thoáng Đãng, Không Dính Viền Trên, Không Badge Đã Lưu) */}
          <header className="shrink-0 flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <div>
              <h3 className="text-type-title font-semibold text-slate-900 dark:text-slate-100">
                {activeTab === 'profile' && 'Hồ sơ cá nhân'}
                {activeTab === 'security' && 'Bảo mật & đổi mật khẩu'}
                {activeTab === 'appearance' && 'Giao diện & hiển thị'}
              </h3>
              <p className="text-type-helper text-slate-500 dark:text-slate-400 mt-0.5">
                {activeTab === 'profile' && 'Thông tin định danh và liên lạc khảo thí'}
                {activeTab === 'security' && 'Quản lý mật khẩu đăng nhập an toàn'}
                {activeTab === 'appearance' && 'Tùy chỉnh chủ đề sáng tối'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer mr-1"
              title="Đóng (Esc)"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </header>

          {/* Body Panel Phải Cuộn Mượt Mà */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-7 pb-8 space-y-6">

            {/* ════════════════════ TAB 1: THÔNG TIN CÁ NHÂN (BENTO PROPERTY CELLS) ════════════════════ */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in-0 duration-150">
                {/* Hero Profile Banner & Avatar Studio */}
                <div className="space-y-4 p-5 rounded-3xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/90 dark:border-slate-800">
                  <div className="flex items-center gap-5">
                    {/* Clickable Avatar with Soft Glow Ring */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group shrink-0 cursor-pointer"
                      title="Nhấp để tải & căn chỉnh ảnh đại diện"
                    >
                      {avatarUrl ? (
                        <DynamicImage
                          src={avatarUrl}
                          alt={displayName}
                          className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-xs group-hover:opacity-85 transition"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-type-title select-none shadow-xs group-hover:opacity-90 transition">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Subtle Hover Camera Icon */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-type-title font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {displayName}
                        </h4>
                        <IdentifierBadge tone="neutral">{userCode}</IdentifierBadge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-type-body-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{roleName}</span>
                        <span>|</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">{deptOrClass}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-type-helper font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                        >
                          <Camera className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Tải ảnh lên</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-type-helper font-medium text-rose-600 dark:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Gỡ ảnh</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── TÙY CHỈNH AVATAR (MONOGRAM GRADIENTS & PRESETS) ── */}
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
                    {/* Hàng 1: Màu Gradient Chữ Viết Tắt */}
                    <div>
                      <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Tùy chọn màu chữ viết tắt
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: 'Xanh Biển (Royal Blue)', from: 'rgb(37, 99, 235)', to: 'rgb(29, 78, 216)', bg: 'from-blue-600 to-blue-800' },
                          { label: 'Xanh Bầu Trời (Sky Blue)', from: 'rgb(2, 132, 199)', to: 'rgb(3, 105, 161)', bg: 'from-sky-600 to-cyan-700' },
                          { label: 'Xanh Ngọc (Emerald)', from: 'rgb(5, 150, 105)', to: 'rgb(13, 148, 136)', bg: 'from-emerald-600 to-teal-700' },
                          { label: 'Cam Hoàng Hôn (Amber)', from: 'rgb(234, 88, 12)', to: 'rgb(217, 119, 6)', bg: 'from-orange-600 to-amber-600' },
                          { label: 'Đỏ Ruby (Rose)', from: 'rgb(225, 29, 72)', to: 'rgb(190, 18, 60)', bg: 'from-rose-600 to-red-700' },
                          { label: 'Xám Đá (Slate Dark)', from: 'rgb(51, 65, 85)', to: 'rgb(15, 23, 42)', bg: 'from-slate-700 to-slate-900' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyCustomAvatar(generateCanvasMonogram(displayName, item.from, item.to), item.label)}
                            title={`Chọn màu: ${item.label}`}
                            className={`h-8 w-8 rounded-xl bg-gradient-to-br ${item.bg} text-white font-semibold text-type-helper flex items-center justify-center shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-white/20`}
                          >
                            {displayName.slice(0, 1).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hàng 2: Biểu tượng Khảo Thí & Học Thuật */}
                    <div>
                      <p className="text-type-helper font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Biểu tượng mẫu khảo thí
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          {
                            label: 'Mũ tốt nghiệp / Học thuật',
                            from: 'rgb(37, 99, 235)',
                            to: 'rgb(29, 78, 216)',
                            bg: 'from-blue-600 to-blue-800',
                            iconText: '🎓',
                          },
                          {
                            label: 'Công nghệ & Lập trình',
                            from: 'rgb(2, 132, 199)',
                            to: 'rgb(3, 105, 161)',
                            bg: 'from-sky-600 to-cyan-700',
                            iconText: '💻',
                          },
                          {
                            label: 'Tri thức & Sách vở',
                            from: 'rgb(5, 150, 105)',
                            to: 'rgb(4, 120, 87)',
                            bg: 'from-emerald-600 to-green-700',
                            iconText: '📚',
                          },
                          {
                            label: 'Giám sát & Bảo mật',
                            from: 'rgb(30, 64, 175)',
                            to: 'rgb(30, 58, 138)',
                            bg: 'from-blue-700 to-blue-950',
                            iconText: '🛡️',
                          },
                          {
                            label: 'Thành tích & Xuất sắc',
                            from: 'rgb(217, 119, 6)',
                            to: 'rgb(180, 83, 9)',
                            bg: 'from-amber-500 to-orange-600',
                            iconText: '🏆',
                          },
                          {
                            label: 'Sinh viên năng động',
                            from: 'rgb(225, 29, 72)',
                            to: 'rgb(159, 18, 57)',
                            bg: 'from-rose-500 to-red-700',
                            iconText: '⭐',
                          },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyCustomAvatar(generateCanvasIcon(item.iconText, item.from, item.to), item.label)}
                            title={`Áp dụng: ${item.label}`}
                            className={`h-8 w-8 rounded-xl bg-gradient-to-br ${item.bg} text-white flex items-center justify-center text-type-body-sm shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-white/20`}
                          >
                            <span>{item.iconText}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Identity Group Cells (Apple ID Style) */}
                <div className="rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-200/60 dark:divide-slate-800/80 overflow-hidden">
                  {/* Row 1: Họ và tên */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-6 py-4 gap-3 sm:gap-4 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Họ và tên</span>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => autoSaveProfile({ fullName })}
                      required
                      className="flex-1 bg-transparent px-3 py-1.5 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition mr-1"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  {/* Row 2: Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-6 py-4 gap-3 sm:gap-4 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>Email</span>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => autoSaveProfile({ email })}
                      className="flex-1 bg-transparent px-3 py-1.5 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition mr-1"
                      placeholder="ten@exam.edu.vn"
                    />
                  </div>

                  {/* Row 3: Số điện thoại */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-6 py-4 gap-3 sm:gap-4 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>Số điện thoại</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => autoSaveProfile({ phone })}
                      className="flex-1 bg-transparent px-3 py-1.5 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition mr-1"
                      placeholder="0912 345 678"
                    />
                  </div>

                  {/* Row 4: Địa chỉ */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-6 py-4 gap-3 sm:gap-4 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>Địa chỉ cư trú</span>
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={() => autoSaveProfile({ address })}
                      className="flex-1 bg-transparent px-3 py-1.5 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition mr-1"
                      placeholder="Nhập địa chỉ cư trú"
                    />
                  </div>
                </div>

                {/* Footer Meta Details */}
                <div className="flex items-center justify-between text-type-helper text-slate-500 dark:text-slate-400 px-2 pt-1 pb-4">
                  <div>Tên đăng nhập: <strong className="font-semibold text-slate-800 dark:text-slate-200">@{profile?.username}</strong></div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Tài khoản đang hoạt động
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════ TAB 2: ĐỔI MẬT KHẨU (VAULT SECURITY) ════════════════════ */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in-0 duration-150">
                {/* Security Vault Banner */}
                <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-type-body-sm text-blue-900 dark:text-blue-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shrink-0 shadow-2xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Bảo mật tài khoản khảo thí</p>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400">Nên thay đổi mật khẩu định kỳ 90 ngày và không chia sẻ cho người khác.</p>
                  </div>
                </div>

                {/* Password Input Group */}
                <div className="rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-200/60 dark:divide-slate-800/80 overflow-hidden">
                  {/* Mật khẩu hiện tại */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-5 py-3.5 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                      <KeyRound className="h-4 w-4 text-slate-400" />
                      <span>Mật khẩu hiện tại <span className="text-rose-500">*</span></span>
                    </div>
                    <div className="relative flex-1 mr-1">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full bg-transparent px-3 py-1.5 pr-10 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mật khẩu mới */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-5 py-3.5 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                      <Lock className="h-4 w-4 text-slate-400" />
                      <span>Mật khẩu mới <span className="text-rose-500">*</span></span>
                    </div>
                    <div className="relative flex-1 mr-1">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-transparent px-3 py-1.5 pr-10 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div className="flex flex-col sm:flex-row sm:items-center px-5 py-3.5 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:w-44 shrink-0 text-type-body-sm font-medium text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      <span>Xác nhận mật khẩu <span className="text-rose-500">*</span></span>
                    </div>
                    <div className="relative flex-1 mr-1">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full bg-transparent px-3 py-1.5 pr-10 rounded-xl text-type-body font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between text-type-helper">
                      <span className="text-slate-500 dark:text-slate-400">Độ an toàn mật khẩu:</span>
                      <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={changingPassword || !newPassword}
                  className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-type-body-sm transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Cập nhật mật khẩu mới</span>
                </button>
              </form>
            )}

            {/* ════════════════════ TAB 3: GIAO DIỆN (MINI WINDOW MOCKUPS) ════════════════════ */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in-0 duration-150">
                <div className="space-y-3.5">
                  <span className="text-type-body font-medium text-slate-900 dark:text-slate-100 block">
                    Chủ đề không gian làm việc
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Light Theme Card */}
                    <button
                      type="button"
                      onClick={() => handleApplyTheme('light')}
                      className={`group flex flex-col p-4 rounded-3xl border text-left transition-all cursor-pointer ${themeMode === 'light'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-600/30 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <div className="h-20 w-full rounded-2xl bg-white border border-slate-200 p-2 space-y-1.5 mb-3 shadow-2xs">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-rose-400" />
                          <div className="h-2 w-2 rounded-full bg-amber-400" />
                          <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="h-2 w-3/4 rounded-md bg-slate-200" />
                        <div className="h-2 w-1/2 rounded-md bg-blue-200" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">Giao diện Sáng</span>
                        <Sun className={`h-4 w-4 ${themeMode === 'light' ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                    </button>

                    {/* Dark Theme Card */}
                    <button
                      type="button"
                      onClick={() => handleApplyTheme('dark')}
                      className={`group flex flex-col p-4 rounded-3xl border text-left transition-all cursor-pointer ${themeMode === 'dark'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-600/30 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <div className="h-20 w-full rounded-2xl bg-slate-950 border border-slate-800 p-2 space-y-1.5 mb-3 shadow-2xs">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="h-2 w-3/4 rounded-md bg-slate-800" />
                        <div className="h-2 w-1/2 rounded-md bg-blue-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">Giao diện Tối</span>
                        <Moon className={`h-4 w-4 ${themeMode === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                    </button>

                    {/* System Theme Card */}
                    <button
                      type="button"
                      onClick={() => handleApplyTheme('system')}
                      className={`group flex flex-col p-4 rounded-3xl border text-left transition-all cursor-pointer ${themeMode === 'system'
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-600/30 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <div className="h-20 w-full rounded-2xl bg-gradient-to-r from-white via-slate-200 to-slate-950 border border-slate-300 dark:border-slate-700 p-2 space-y-1.5 mb-3 shadow-2xs">
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-slate-400" />
                        </div>
                        <div className="h-2 w-3/4 rounded-md bg-slate-400/50" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">Theo hệ thống</span>
                        <Laptop className={`h-4 w-4 ${themeMode === 'system' ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Table Density Switch */}
                <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-type-body-sm font-semibold text-slate-900 dark:text-slate-100">
                      Chế độ bảng thu gọn (Compact View)
                    </p>
                    <p className="text-type-helper text-slate-500 dark:text-slate-400">
                      Tăng mật độ hiển thị nhiều dữ liệu hơn trên cùng một màn hình
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={compactTable}
                    onClick={() => {
                      const next = !compactTable;
                      setCompactTable(next);
                      localStorage.setItem('table_compact', String(next));
                      setToast({ message: 'Đã lưu tùy chọn bảng!', type: 'success' });
                    }}
                    style={{ minHeight: '24px', height: '24px', width: '44px', minWidth: '44px' }}
                    className={`relative inline-flex items-center !min-h-0 !h-6 !w-11 shrink-0 cursor-pointer rounded-full p-0.5 border-0 transition-colors duration-200 ease-in-out focus:outline-none ${
                      compactTable ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      style={{ height: '20px', width: '20px' }}
                      className={`pointer-events-none inline-block !h-5 !w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                        compactTable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Global Toast for Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Avatar Cropper Studio Modal (Phóng to, Thu nhỏ, Di chuyển, Xoay) */}
      <AvatarCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropperOpen(false)}
        onApply={handleCropperApply}
      />
    </div>,
    document.body
  );
}
