import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Hệ thống Quản lý Khảo thí Sinh viên',
  description: 'Quản lý lịch thi, phòng thi, ngân hàng câu hỏi, đề thi tự động',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
