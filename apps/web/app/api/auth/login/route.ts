import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';
  const body = await req.json().catch(() => ({}));
  const ac = (body.org_acronym || body.acronym || body.orgAcronym || '').toString().trim().toUpperCase();
  if (!ac) return NextResponse.json({ message: 'Organization acronym required' }, { status: 401 });

  const upstream = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, org_acronym: ac, acronym: ac }),
    cache: 'no-store',
  });
  const text = await upstream.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { message: text }; }

  if (!upstream.ok) {
    return NextResponse.json(json || { message: 'Login failed' }, { status: upstream.status });
  }

  const token: string = json.access_token;
  const res = NextResponse.json({ user: json.user, refresh_token: json.refresh_token, access_token: token, success: true });
  // HttpOnly + Secure + SameSite=Lax — JS cannot read, mitigates XSS steal (point 2)
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('onehr_auth', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86400,
  });
  // Keep refresh as HttpOnly too
  if (json.refresh_token) {
    res.cookies.set('onehr_refresh', json.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 86400,
    });
  }
  return res;
}
