"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "🧲" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/orcamentos", label: "Orçamentos", icon: "🧾" },
  { href: "/usinas", label: "Usinas", icon: "🔆" },
  { href: "/tarefas", label: "Tarefas", icon: "✅" },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground shadow-sm">
          ☀️
        </span>
        <span className="leading-none">
          <span className="block text-base font-extrabold tracking-tight">
            PCA<span className="text-primary"> SOLAR</span>
          </span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
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
