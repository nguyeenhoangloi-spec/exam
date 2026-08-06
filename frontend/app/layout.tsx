import './globals.css';
import React from 'react';
import { PageTitleProvider } from '../components/PageTitleContext';
import { RouteShell } from '../components/RouteShell';

export const metadata = {
  title: 'Hệ thống Quản lý Khảo thí Sinh viên',
  description: 'Quản lý lịch thi, phòng thi, ngân hàng câu hỏi, đề thi tự động',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('theme') === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (localStorage.getItem('sidebar-collapsed') === 'true') {
                    document.documentElement.classList.add('sidebar-collapsed');
                  } else {
                    document.documentElement.classList.remove('sidebar-collapsed');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 min-h-screen">
        <PageTitleProvider>
          <RouteShell>{children}</RouteShell>
        </PageTitleProvider>
      </body>
    </html>
  );
}
