import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { PageTitleProvider } from '../components/PageTitleContext';
import { RouteShell } from '../components/RouteShell';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Hệ thống quản lý khảo thí sinh viên',
  description: 'Quản lý lịch thi, phòng thi, ngân hàng câu hỏi, đề thi tự động',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved === 'dark' || (saved !== 'light' && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
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
      <body className="typography-scale bg-slate-50 dark:bg-slate-950 min-h-screen">
        <PageTitleProvider>
          <RouteShell>{children}</RouteShell>
        </PageTitleProvider>
      </body>
    </html>
  );
}
