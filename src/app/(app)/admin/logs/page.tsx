import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog, Profile } from "@/lib/database.types";

export default async function LogsPage() {
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Logs / Auditoria</h1>
          <p className="text-sm text-muted">Histórico de ações administrativas do sistema.</p>
        </div>
        <AccessDenied />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: logs }, { data: profiles }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("*"),
  ]);

  const nameById = new Map((profiles ?? []).map((p: Profile) => [p.id, p.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Logs / Auditoria</h1>
        <p className="text-sm text-muted">
          Últimas 100 ações administrativas registradas (papéis, permissões e demais alterações
          sensíveis).
        </p>
      </div>

      <Card>
        {!logs || logs.length === 0 ? (
          <EmptyState title="Nenhum registro de auditoria ainda" />
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log: AuditLog) => (
              <li key={log.id} className="flex items-start justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm text-foreground">{log.description ?? log.action}</p>
                  <p className="text-xs text-muted">
                    {log.module} · {nameById.get(log.user_id ?? "") ?? "sistema"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatDateTime(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
