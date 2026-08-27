import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_PUBLIC_ANSWER_FILES = new Set([
  '/file-mau-cau-hoi-test.csv',
  '/mau-cau-hoi-7-cot-test.csv',
]);

const OBSOLETE_ROUTES = new Set([
  '/profile',
  '/settings',
  '/change-password',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_PUBLIC_ANSWER_FILES.has(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (OBSOLETE_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/file-mau-cau-hoi-test.csv',
    '/mau-cau-hoi-7-cot-test.csv',
    '/profile',
    '/settings',
    '/change-password',
  ],
};

