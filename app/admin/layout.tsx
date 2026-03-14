'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ADMIN_NAV_SECTIONS, ADMIN_ROUTES, BRAND_ASSETS } from '../../lib/constants';
import { auth, db } from '../../lib/firebaseConfig.js';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicAdminRoute = pathname === ADMIN_ROUTES.login;
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>(
    isPublicAdminRoute ? 'allowed' : 'checking',
  );

  useEffect(() => {
    if (isPublicAdminRoute) {
      setState('allowed');
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState('denied');
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const role = snap.exists() ? snap.data()?.role : null;
        const isActive = snap.exists() ? snap.data()?.isActive !== false : false;
        const isAdmin = role === 'admin' || role === 'superadmin';
        setState(isAdmin && isActive ? 'allowed' : 'denied');
      } catch {
        setState('denied');
      }
    });

    return () => unsub();
  }, [isPublicAdminRoute]);

  if (isPublicAdminRoute) {
    return <>{children}</>;
  }

  if (state === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 text-white">
        <div className="opacity-80">Checking admin access...</div>
      </main>
    );
  }

  if (state === 'denied') {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 text-white">
        <div className="space-y-3 text-center">
          <div className="text-xl font-semibold">Access denied</div>
          <p className="opacity-80">You must be an active admin to view this area.</p>
          <Link
            href={ADMIN_ROUTES.login}
            className="inline-block rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-600"
          >
            Go to Admin Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href={ADMIN_ROUTES.home} className="flex items-center gap-3 font-bold">
              <img src={BRAND_ASSETS.logo} alt="MyHalftimeQuiz" className="h-10 w-10 object-contain" />
              <span>MyHalftimeQuiz Admin</span>
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Sports Ops</span>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm text-white/75">
            {ADMIN_NAV_SECTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
