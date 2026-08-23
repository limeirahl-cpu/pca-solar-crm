"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Permission, Profile } from "@/lib/database.types";
import { PERMISSION_MODULES, PERMISSION_MODULE_LABEL, type PermissionModule } from "@/lib/nav";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";

type PermKey = "can_view" | "can_create" | "can_edit" | "can_delete";
const COLUMNS: { key: PermKey; label: string }[] = [
  { key: "can_view", label: "Ver" },
  { key: "can_create", label: "Criar" },
  { key: "can_edit", label: "Editar" },
  { key: "can_delete", label: "Excluir" },
];

export function PermissionsManager({
  profiles,
  initialPermissions,
}: {
  profiles: Profile[];
  initialPermissions: Permission[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(profiles[0]?.id ?? "");
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const rows = useMemo(
    () => permissions.filter((p) => p.user_id === selectedUser),
    [permissions, selectedUser]
  );

  function permFor(mod: PermissionModule) {
    return rows.find((r) => r.module === mod);
  }

  async function handleToggle(mod: PermissionModule, key: PermKey, current: Permission | undefined) {
    if (!selectedUser) return;
    const cellKey = `${mod}:${key}`;
    setSavingKey(cellKey);

    const flags = {
      can_view: current?.can_view ?? false,
      can_create: current?.can_create ?? false,
      can_edit: current?.can_edit ?? false,
      can_delete: current?.can_delete ?? false,
    };
    flags[key] = !flags[key];

    const { data } = await supabase
      .from("permissions")
      .upsert({ user_id: selectedUser, module: mod, ...flags }, { onConflict: "user_id,module" })
      .select()
      .single();

    if (data) {
      setPermissions((prev) => [
        ...prev.filter((p) => !(p.user_id === selectedUser && p.module === mod)),
        data,
      ]);

      const userName = profiles.find((p) => p.id === selectedUser)?.full_name ?? "usuário";
      await supabase.from("audit_logs").insert({
        module: "admin_permissoes",
        action: "alterar_permissao",
        record_id: selectedUser,
        description: `Permissão "${key}" do módulo "${mod}" alterada para ${userName}.`,
      });
    }

    setSavingKey(null);
    router.refresh();
  }

  if (profiles.length === 0) {
    return (
      <Card>
        <EmptyState title="Nenhum usuário cadastrado" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <label className="text-sm font-medium text-foreground">Usuário</label>
        <Select
          className="mt-1 max-w-sm"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || "Sem nome"}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-5 py-3">Módulo</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-3 py-3 text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PERMISSION_MODULES.map((mod) => {
              const current = permFor(mod);
              return (
                <tr key={mod}>
                  <td className="px-5 py-2.5 font-medium text-foreground">
                    {PERMISSION_MODULE_LABEL[mod]}
                  </td>
                  {COLUMNS.map((c) => {
                    const cellKey = `${mod}:${c.key}`;
                    return (
                      <td key={c.key} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={current?.[c.key] ?? false}
                          disabled={savingKey === cellKey}
                          onChange={() => handleToggle(mod, c.key, current)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
