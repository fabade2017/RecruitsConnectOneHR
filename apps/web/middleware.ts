import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// MVP RBAC middleware — protects HR routes by role (cookie onehr_auth = JWT from API)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('onehr_auth')?.value || request.cookies.get('onehr_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes (face-enroll is public link for employee to self-enroll, but page checks token)
  const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/manual', '/face-enroll', '/api/health'];
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api/health') || pathname.startsWith('/face-enroll')) {
    return NextResponse.next();
  }

  // Protected HR routes — require auth (includes /help center, collapsed sidebar by default per 2026-09-09)
  const protectedPrefixes = ['/hr', '/executive', '/manager', '/employee', '/dashboard', '/payroll', '/jobs', '/learning', '/compliance', '/attendance', '/leave', '/employees', '/recruitment', '/admin', '/onboarding', '/shifts', '/projects', '/performance', '/engagement', '/reports', '/analytics', '/workflows', '/integrations', '/settings', '/documents', '/assets', '/chat', '/subscriptions', '/help', '/audit', '/id-cards', '/ai-copilot', '/intelligence'];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based redirect: decode JWT payload (no verify here, API verifies)
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const role = payload.role as string;
      // HR trying to access employee-only? Allow — but executive can only see executive
      // For MVP, just ensure token exists; API enforces fine-grained RBAC
      if (pathname === '/login' && token) {
        // Redirect by role
        const target = role === 'employee' ? '/employee' : role === 'manager' ? '/manager' : role === 'executive' ? '/executive' : '/hr';
        return NextResponse.redirect(new URL(target, request.url));
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_static|favicon|.*\\.).*)'],
};
