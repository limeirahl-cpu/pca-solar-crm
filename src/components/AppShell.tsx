"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

const COLLAPSE_STORAGE_KEY = "pca-sidebar-collapsed";

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  // Lê o estado salvo já na primeira renderização do cliente (evita um
  // useEffect só para isso). No servidor sempre começa expandido; no
  // cliente, se a pessoa já tinha recolhido o menu antes, respeita isso.
  const [collapsed, setCollapsed] = useState<boolean>(readStoredCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Fundo escuro atrás do menu quando aberto no celular */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        userEmail={userEmail}
        // No celular o menu é uma gaveta temporária: mesmo que o usuário
        // tenha recolhido o menu no desktop antes, aqui ele sempre abre
        // cheio (com os nomes), já que não faz sentido um menu "só ícones"
        // deslizando por cima da tela.
        collapsed={collapsed && !mobileOpen}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior — só aparece no celular/tablet */}
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[4px] rounded-lg border border-border text-foreground"
          >
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
          </button>
          <div className="relative h-7 w-7 shrink-0">
            <Image src="/logo-pca.png" alt="PCA Solar" fill sizes="28px" className="object-contain" />
          </div>
          <span className="font-tabular text-sm font-semibold text-foreground">PCA Solar</span>
        </header>

        <main
          className={cn(
            "flex-1 overflow-x-hidden bg-background px-6 py-6 md:px-10 md:py-8",
            "transition-[padding] duration-300"
          )}
        >
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
