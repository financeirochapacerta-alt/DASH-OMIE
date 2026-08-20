"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types/auth";
import { navigationForRole } from "@/features/management/navigation";

export function AppShell({ children, role, userName, logoutAction }: { children: React.ReactNode; role: UserRole; userName: string; logoutAction: () => Promise<void> }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const navigation = navigationForRole(role);
  return <div className="app-frame">
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Navegação principal">
      <div className="brand-lockup"><div className="brand-placeholder" aria-hidden="true">CC</div><div><strong>CHAPA CERTA</strong><span>Central de Gestão</span></div></div>
      <nav>{navigation.map((item, index) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href ? "nav-link active" : "nav-link"} aria-current={pathname === item.href ? "page" : undefined}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.label}</Link>)}</nav>
      <div className="sidebar-footer"><div className="avatar" aria-hidden="true">{userName.slice(0, 2).toUpperCase()}</div><div><strong>{userName}</strong><span>{role}</span></div><form action={logoutAction}><button className="icon-button" aria-label="Sair">↗</button></form></div>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
    <div className="workspace"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Abrir navegação">☰</button><div><span className="environment-dot" /> Dados gerenciais protegidos</div><div className="topbar-user">{userName}<span>{role}</span></div></header><main className="management-main">{children}</main></div>
  </div>;
}
