import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_PUBLIC_ANSWER_FILES = new Set([
  '/file-mau-cau-hoi-test.csv',
  '/mau-cau-hoi-7-cot-test.csv',
]);

export function middleware(request: NextRequest) {
  if (BLOCKED_PUBLIC_ANSWER_FILES.has(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/file-mau-cau-hoi-test.csv',
    '/mau-cau-hoi-7-cot-test.csv',
  ],
};
