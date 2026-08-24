"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { NAV_GROUPS } from "@/lib/nav";

const DEFAULT_OPEN = ["principal", "comercial", "monitoramento", "tarefas", "admin"];

function isGroupActive(pathname: string, items: { href: string }[]) {
  return items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
}

export function Sidebar({
  userEmail,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  userEmail: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>(DEFAULT_OPEN);

  function toggleGroup(key: string) {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const showLabels = !collapsed;

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        "transition-[transform,width] duration-300 ease-in-out",
        "md:static md:z-auto md:translate-x-0",
        collapsed ? "w-[76px]" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className={cn("flex items-center gap-3 px-5 py-5", collapsed && "justify-center px-0")}>
        <div className="relative h-11 w-11 shrink-0 rounded-xl bg-white p-1.5 shadow-sm">
          <Image src="/logo-pca.png" alt="PCA Solar" fill sizes="44px" className="object-contain p-0.5" />
        </div>
        {showLabels && (
          <div className="min-w-0">
            <p className="font-tabular truncate text-[15px] font-semibold text-sidebar-foreground">
              PCA Solar
            </p>
            <p className="truncate text-[11px] font-medium text-sidebar-foreground/50">
              Painel de gestão
            </p>
          </div>
        )}
      </div>

      {/* Botão de recolher/expandir — só existe na versão desktop */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="absolute top-7 -right-3 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-sidebar text-sidebar-foreground/70 shadow-sm hover:text-sidebar-foreground md:flex"
      >
        <span className={cn("text-xs transition-transform duration-300", collapsed ? "rotate-180" : "")}>
          ‹
        </span>
      </button>

      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const active = isGroupActive(pathname, group.items);
          const open = collapsed || openGroups.includes(group.key) || active;
          const single = group.items.length === 1;

          return (
            <div key={group.key} className="pt-2">
              {!single && showLabels && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/45 hover:text-sidebar-foreground/70"
                >
                  {group.label}
                  <span className={cn("transition-transform", open ? "rotate-90" : "")}>›</span>
                </button>
              )}

              {(single || open) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const itemActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={onCloseMobile}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          collapsed && "justify-center px-0",
                          itemActive
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                        )}
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        {showLabels && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {!item.ready && (
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                                Em breve
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-white/10 px-4 py-4", collapsed && "px-2 text-center")}>
        {showLabels ? (
          <>
            <p className="truncate text-xs text-sidebar-foreground/60">{userEmail}</p>
            <button
              onClick={handleLogout}
              className="mt-2 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground"
            >
              Sair
            </button>
            <p className="mt-3 text-[11px] leading-snug text-sidebar-foreground/40">
              {COMPANY.legalName}
              <br />
              CNPJ {COMPANY.cnpj}
            </p>
          </>
        ) : (
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
          >
            ⏻
          </button>
        )}
      </div>
    </aside>
  );
}
