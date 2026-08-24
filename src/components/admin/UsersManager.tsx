"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AppRole, Profile, UserRole } from "@/lib/database.types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
};

export function UsersManager({
  initialProfiles,
  initialRoles,
}: {
  initialProfiles: Profile[];
  initialRoles: UserRole[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  const [savingId, setSavingId] = useState<string | null>(null);

  function roleFor(userId: string): AppRole | "" {
    return roles.find((r) => r.user_id === userId)?.role ?? "";
  }

  async function handleRoleChange(userId: string, userName: string, role: string) {
    setSavingId(userId);

    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (role) {
      await supabase.from("user_roles").insert({ user_id: userId, role: role as AppRole });
    }

    await supabase.from("audit_logs").insert({
      module: "admin_usuarios",
      action: role ? "alterar_papel" : "remover_papel",
      record_id: userId,
      description: role
        ? `Papel de ${userName} alterado para ${ROLE_LABEL[role as AppRole]}.`
        : `Papel de ${userName} removido.`,
    });

    setRoles((prev) => [
      ...prev.filter((r) => r.user_id !== userId),
      ...(role
        ? [{ id: crypto.randomUUID(), user_id: userId, role: role as AppRole, created_at: new Date().toISOString() }]
        : []),
    ]);
    setSavingId(null);
    router.refresh();
  }

  return (
    <Card>
      {initialProfiles.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" />
      ) : (
        <ul className="divide-y divide-border">
          {initialProfiles.map((profile) => {
            const currentRole = roleFor(profile.id);
            return (
              <li
                key={profile.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {profile.full_name || "Sem nome"}
                  </p>
                  <p className="text-xs text-muted">
                    Desde {formatDate(profile.created_at)}
                    {profile.phone ? ` · ${profile.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {currentRole ? (
                    <Badge tone={currentRole === "admin" ? "blue" : "green"}>
                      {ROLE_LABEL[currentRole]}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Sem papel</Badge>
                  )}
                  <Select
                    value={currentRole}
                    disabled={savingId === profile.id}
                    onChange={(e) =>
                      handleRoleChange(profile.id, profile.full_name || "usuário", e.target.value)
                    }
                    className="w-44"
                  >
                    <option value="">Sem papel</option>
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                  </Select>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
