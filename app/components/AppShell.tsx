"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
              <Link href="/profile" className="d-flex align-items-center justify-content-center rounded-circle bg-white border border-light shadow-sm" style={{ width: 42, height: 42, textDecoration: "none" }}>
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
                  <Link key={item.href} href={item.href} className="nav-pill primary">
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link key={item.href} href={item.href} className={active ? "nav-pill active" : "nav-pill"}>
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
