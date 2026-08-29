'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../types';
import { canAccessPath, resolveWorkspaceRoute } from '../lib/access';
import { getAuthUser } from '../lib/auth';
import api, { restoreAuthSession, warmupGlobalCache } from '../lib/api';
import { applyTheme, getSavedTheme, initThemeListener } from '../lib/theme';
import { usePageTitleValue } from './PageTitleContext';

/** Public entry/support routes and pages that intentionally omit the app shell. */
const PUBLIC_ROUTES = new Set(['/', '/login', '/contact', '/forgot-password']);
const SHELLLESS_PREFIXES = ['/login', '/student/online-exam', '/contact', '/forgot-password'];

const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.has(pathname);

const isShelllessRoute = (pathname: string) =>
    SHELLLESS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

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
    const [effectivePermissions, setEffectivePermissions] = useState<Set<string> | null>(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [permissionOwnerId, setPermissionOwnerId] = useState<number | null>(null);
    const permissionsReady = permissionsLoaded && permissionOwnerId === user?.id;

    // Sidebar state persists across navigation (kept in state, not remounted)
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            try {
                return window.localStorage.getItem('sidebar-collapsed') === 'true';
            } catch {
                return false;
            }
        }
        return false;
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = mobileOpen ? 'hidden' : previousOverflow;
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        try {
            const isCollapsed = window.localStorage.getItem('sidebar-collapsed') === 'true';
            setCollapsed(isCollapsed);
            document.documentElement.classList.toggle('sidebar-collapsed', isCollapsed);
        } catch {
            /* ignore */
        }
    }, []);

    // Apply saved theme (dark mode) on first load and attach system listeners
    useEffect(() => {
        try {
            const savedTheme = getSavedTheme();
            applyTheme(savedTheme, false);
        } catch {
            /* ignore */
        }
        return initThemeListener();
    }, []);

    // Load auth user and permissions once on mount, and subscribe to auth events.
    // We intentionally DO NOT re-run this on every pathname change to avoid unmounting the shell.
    useEffect(() => {
        let active = true;
        const updateAuthUser = async (force = false) => {
            await restoreAuthSession();
            if (!active) return;
            const u = getAuthUser();
            setUser(u);
            setAuthLoaded(true);
            if (u?.role) {
                warmupGlobalCache(u.role);
                // If permissions are already loaded for this user and not forced, reuse them immediately
                if (!force && permissionsLoaded && permissionOwnerId === u.id) {
                    return;
                }
                try {
                    const response = await api.get('/access-control/me/effective');
                    if (!active) return;
                    const allowedCodes = (response.data?.permissions || [])
                        .filter((permission: { allowed?: boolean }) => permission.allowed)
                        .map((permission: { code: string }) => permission.code);
                    setEffectivePermissions(new Set(allowedCodes));
                    setPermissionOwnerId(u.id);
                } catch {
                    if (!active) return;
                    // Backend remains the final authority. Keep role navigation available
                    // when the effective-permission endpoint is temporarily unavailable.
                    setEffectivePermissions(new Set());
                    setPermissionOwnerId(u.id);
                } finally {
                    if (active) setPermissionsLoaded(true);
                }
            } else {
                setEffectivePermissions(null);
                setPermissionOwnerId(null);
                setPermissionsLoaded(true);
            }
        };

        void updateAuthUser();

        if (typeof window !== 'undefined') {
            const handleAuthChange = () => { void updateAuthUser(true); };
            const handleAuthStorage = (event: StorageEvent) => {
                if (event.key === 'exam_app_user') {
                    void updateAuthUser(true);
                }
            };
            const handlePageShow = (event: PageTransitionEvent) => {
                if (event.persisted) {
                    void updateAuthUser();
                }
            };
            window.addEventListener('auth-change', handleAuthChange);
            window.addEventListener('storage', handleAuthStorage);
            window.addEventListener('pageshow', handlePageShow);
            return () => {
                active = false;
                window.removeEventListener('auth-change', handleAuthChange);
                window.removeEventListener('storage', handleAuthStorage);
                window.removeEventListener('pageshow', handlePageShow);
            };
        }
    }, [permissionsLoaded, permissionOwnerId]);

    const handleToggle = () => {
        setIsToggling(true);
        setCollapsed((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem('sidebar-collapsed', String(next));
                document.documentElement.classList.toggle('sidebar-collapsed', next);
            } catch {
                /* ignore */
            }
            return next;
        });
        setTimeout(() => setIsToggling(false), 350);
    };

    // Re-evaluate every history navigation against the current session. Browser
    // Back/Forward must never make a protected page visible after logout.
    useEffect(() => {
        if (!authLoaded) return;

        if (!user) {
            if (!isPublicRoute(pathname)) {
                router.replace('/login');
                if (typeof window !== 'undefined') {
                    window.location.replace('/login');
                }
            }
            return;
        }

        if (!permissionsReady) return;

        if (pathname === '/' || pathname === '/login') {
            router.replace(resolveWorkspaceRoute(user.role, effectivePermissions));
            return;
        }

        if (isPublicRoute(pathname)) return;

        if (!canAccessPath(user.role, pathname, effectivePermissions)) {
            router.replace(resolveWorkspaceRoute(user.role, effectivePermissions));
        }
    }, [user, authLoaded, permissionsReady, effectivePermissions, pathname, router]);

    // 1. Public entry/support routes always render immediately (no auth blocking)
    if (isPublicRoute(pathname)) {
        return <>{children}</>;
    }

    // 2. While checking session on protected routes, show clean loading state
    if (!authLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-live="polite">
                <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <span>Đang tải hệ thống khảo thí...</span>
                </div>
            </div>
        );
    }

    // 3. If unauthenticated on a protected route, show redirecting state
    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-live="polite">
                <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <span>Đang chuyển hướng tới trang đăng nhập...</span>
                </div>
            </div>
        );
    }

    // 4. While permissions are loading for the authenticated user
    if (!permissionsReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-live="polite">
                <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <span>Đang thiết lập quyền truy cập...</span>
                </div>
            </div>
        );
    }

    // 5. Public support routes and protected exam routes render without the shell
    if (isShelllessRoute(pathname) && canAccessPath(user.role, pathname, effectivePermissions)) {
        return <>{children}</>;
    }

    // 6. While redirecting to the workspace if user cannot access current path
    if (!canAccessPath(user.role, pathname, effectivePermissions)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-live="polite">
                <div className="flex flex-col items-center gap-3 text-type-body text-slate-700 dark:text-slate-300">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <span>Đang chuyển đến không gian làm việc...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-clip bg-slate-50 dark:bg-slate-950">
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Đóng menu điều hướng"
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar
                user={user}
                collapsed={collapsed}
                onToggle={handleToggle}
                isToggling={isToggling}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                effectivePermissions={effectivePermissions}
            />

            <div
                className={`app-shell-main min-h-screen min-w-0 transition-[margin-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[margin-left] ${collapsed ? 'md:ml-[72px]' : 'md:ml-[252px]'}`}
            >
                <Header user={user} title={title} collapsed={collapsed} onToggleSidebar={handleToggle} onMenuClick={() => setMobileOpen(true)} />
                {/* pt-16 (64px) matches the fixed header height (h-16) so content never hides underneath it */}
                <main className="w-full min-w-0 max-w-full overflow-x-clip pt-16 min-h-screen">
                    <div key={pathname} className="animate-in fade-in-0 duration-150 motion-reduce:animate-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
