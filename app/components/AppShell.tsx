"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export const navItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/battle", label: "Battle", icon: "⚔️" },
  { href: "/log", label: "Log", icon: "＋" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/progress", label: "Progress", icon: "📈" },
];

type AppShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export function AppShell({ title, subtitle, children, rightSlot }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) router.replace("/login");
      setCheckingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAuth) {
    return <div className="app-shell d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div className="app-shell">
      <div className="app-phone d-flex flex-column">
        <header className="px-3 py-3 border-bottom border-light-subtle bg-transparent">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <div>
              <p className="section-label mb-1">Sister Showdown</p>
              {title ? <h1 className="h4 fw-bolder mb-1">{title}</h1> : <div className="placeholder-glow"><span className="placeholder col-6 rounded-pill" /></div>}
              {subtitle ? <small className="text-secondary">{subtitle}</small> : null}
            </div>

            {rightSlot ?? (
              <Link href="/profile" className="d-flex align-items-center justify-content-center rounded-circle bg-white border border-light shadow-sm" style={{ width: 42, height: 42, textDecoration: "none" }} aria-label="Profile">
                <span style={{ fontSize: 20 }}>👩‍💼</span>
              </Link>
            )}
          </div>
        </header>

        <main className="flex-grow-1 px-3 pb-5 pt-3">{children}</main>

        <nav className="navbar-bottom">
          <div className="d-flex gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href === "/dashboard" && pathname === "/");

              if (item.href === "/log") {
                return (
                  <Link key={item.href} href={item.href} className={`nav-pill nav-log${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                    <span className="nav-fab-icon" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link key={item.href} href={item.href} className={active ? "nav-pill active" : "nav-pill"} aria-current={active ? "page" : undefined}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
