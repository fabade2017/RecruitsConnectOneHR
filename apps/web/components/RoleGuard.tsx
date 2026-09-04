'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const t = localStorage.getItem('onehr_token');
    const u = localStorage.getItem('onehr_user');
    if (t && u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
  }, []);
  return user;
}

export function RoleGuard({ allow, children }: { allow: string[]; children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('onehr_token');
    if (!token) { router.replace('/login'); return; }
    if (user && !allow.includes(user.role) && !['org_admin','super_admin'].includes(user.role)) {
      // Redirect to own home
      const target = user.role === 'employee' ? '/employee' : user.role === 'manager' ? '/manager' : '/hr';
      router.replace(target);
    } else if (user) setChecked(true);
  }, [user, allow, router]);
  if (!checked && user) return <div className="p-6 text-sm text-slate-500">Checking permissions… Role: {user.role}</div>;
  return <>{children}</>;
}
