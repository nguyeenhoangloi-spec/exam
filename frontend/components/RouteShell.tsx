'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../types';
import { canAccessPath, resolveWorkspaceRoute } from '../lib/access';
import { getAuthUser } from '../lib/auth';
import api, { restoreAuthSession, warmupGlobalCache } from '../lib/api';
import { NavigationProgress } from './NavigationProgress';
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
        let active = true;
        const updateAuthUser = async () => {
            await restoreAuthSession();
            if (!active) return;
            const u = getAuthUser();
            setUser(u);
            setAuthLoaded(true);
            if (u?.role) {
                warmupGlobalCache(u.role);
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
            const handleAuthChange = () => { void updateAuthUser(); };
            const handleAuthStorage = (event: StorageEvent) => {
                if (event.key === 'exam_app_user') {
                    void updateAuthUser();
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
    }, [pathname]);

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

    if (!authLoaded) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    // Never render protected children while unauthenticated. This blocks stale
    // history snapshots after logout while the router returns to /login.
    if (!user) {
        return isPublicRoute(pathname)
            ? <>{children}</>
            : <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    if (!permissionsReady && !isPublicRoute(pathname)) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    // Keep entry routes blank while an authenticated user is redirected to the
    // correct workspace, preventing the login page from flashing on Back.
    if (pathname === '/' || pathname === '/login') {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    // Public support routes and protected exam routes render without the shell.
    if (isPublicRoute(pathname) || (isShelllessRoute(pathname) && canAccessPath(user.role, pathname, effectivePermissions))) {
        return <>{children}</>;
    }

    // While redirecting to the workspace, keep the shell mounted but blank
    if (!canAccessPath(user.role, pathname, effectivePermissions)) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" aria-live="polite" />;
    }

    return (
        <div className="min-h-screen overflow-x-clip bg-slate-50 dark:bg-slate-950">
            <NavigationProgress />
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
                <main className="w-full min-w-0 max-w-full overflow-x-clip pt-16 min-h-screen">{children}</main>
            </div>
        </div>
    );
};
