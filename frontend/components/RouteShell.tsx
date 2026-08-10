'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../types';
import { canAccessPath, workspaceRoutes } from '../lib/access';
import { getAuthUser } from '../lib/auth';
import { warmupGlobalCache } from '../lib/api';
import { NavigationProgress } from './NavigationProgress';
import { usePageTitleValue } from './PageTitleContext';

/**
 * Full-screen routes that must render without the sidebar/header shell
 * (online exam taking, proctor live dashboard, login, etc.).
 */
const FULLSCREEN_PREFIXES = ['/login', '/student/online-exam', '/contact', '/forgot-password'];

const isFullscreenRoute = (pathname: string) =>
    FULLSCREEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * Persistent application shell mounted once in the root layout.
 * It stays mounted across page navigations so the sidebar/header never
 * remount or "reload" when switching tabs — only the page content swaps.
 */
export const RouteShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const title = usePageTitleValue();

    const [user, setUser] = useState<User | null>(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    // Sidebar state persists across navigation (kept in state, not remounted)
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        setCollapsed(window.localStorage.getItem('sidebar-collapsed') === 'true');
    }, []);

    // Apply saved theme (dark mode) on first load so it persists across pages
    useEffect(() => {
        try {
            const theme = window.localStorage.getItem('theme');
            document.documentElement.classList.toggle('dark', theme === 'dark');
        } catch (e) {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        const updateAuthUser = () => {
            const u = getAuthUser();
            setUser(u);
            setAuthLoaded(true);
            if (u?.role) {
                warmupGlobalCache(u.role);
            }
        };

        updateAuthUser();

        if (typeof window !== 'undefined') {
            window.addEventListener('auth-change', updateAuthUser);
            return () => window.removeEventListener('auth-change', updateAuthUser);
        }
    }, [pathname]);

    useEffect(() => {
        window.localStorage.setItem('sidebar-collapsed', String(collapsed));
        document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    }, [collapsed]);

    const handleToggle = () => {
        setIsToggling(true);
        setCollapsed((prev) => !prev);
        setTimeout(() => setIsToggling(false), 350);
    };

    // Redirect to the user's workspace when they hit an unauthorized route
    useEffect(() => {
        if (!user || !authLoaded || isFullscreenRoute(pathname)) return;
        if (!canAccessPath(user.role, pathname) && pathname !== workspaceRoutes[user.role]) {
            router.replace(workspaceRoutes[user.role]);
        }
    }, [user, authLoaded, pathname, router]);

    if (!authLoaded) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    // Login / full-screen routes render without the shell
    if (!user || isFullscreenRoute(pathname)) {
        return <>{children}</>;
    }

    // While redirecting to the workspace, keep the shell mounted but blank
    if (!canAccessPath(user.role, pathname)) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    return (
        <div className="min-h-screen overflow-x-clip bg-slate-50 dark:bg-slate-950">
            <NavigationProgress />
            <Sidebar
                user={user}
                collapsed={collapsed}
                onToggle={handleToggle}
                isToggling={isToggling}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Đóng menu điều hướng"
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div
                className={`app-shell-main min-h-screen min-w-0 ${isToggling ? 'transition-[margin] duration-300 ease-in-out' : ''
                    } ${collapsed ? 'md:ml-[72px]' : 'md:ml-[252px]'}`}
            >
                <Header user={user} title={title} collapsed={collapsed} onToggleSidebar={handleToggle} onMenuClick={() => setMobileOpen(true)} />
                {/* pt-16 (64px) matches the fixed header height (h-16) so content never hides underneath it */}
                <main className="w-full pt-16 min-h-screen">{children}</main>
            </div>
        </div>
    );
};
