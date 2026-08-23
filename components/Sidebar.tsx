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

export function Sidebar({ userEmail }: { userEmail: string | null }) {
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

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center px-5 py-5">
        <div className="relative h-11 w-11">
          <Image
            src="/logo-pca.png"
            alt="PCA Solar"
            fill
            sizes="44px"
            className="object-contain object-left"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => {
          const active = isGroupActive(pathname, group.items);
          const open = openGroups.includes(group.key) || active;
          const single = group.items.length === 1;

          return (
            <div key={group.key} className="pt-2">
              {!single && (
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          itemActive
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
                        )}
                      >
                        <span>{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {!item.ready && (
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                            Em breve
                          </span>
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

      <div className="border-t border-white/10 px-4 py-4">
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
      </div>
    </aside>
  );
}
