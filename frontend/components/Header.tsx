'use client';

import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { removeAuth } from '../lib/auth';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, title = 'Hệ thống Quản lý Khảo thí' }) => {
  const handleLogout = () => {
    removeAuth();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <UserIcon className="w-4 h-4 text-sky-600" />
          <div className="text-xs">
            <span className="font-semibold text-gray-700">{user?.username}</span>
            <span className="text-gray-400 ml-1">({user?.role})</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
