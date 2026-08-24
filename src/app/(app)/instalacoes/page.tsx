import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { INSTALACAO_LABEL, INSTALACAO_TONE } from "@/lib/projetos";
import { formatDate } from "@/lib/utils";

export default async function InstalacoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instalacoes")
    .select("*, projects(nome)")
    .order("data_agendada", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Instalações</h1>
        <p className="text-sm text-muted">Agenda de instalações de todos os projetos.</p>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="Nenhuma instalação agendada"
            description="Instalações são agendadas dentro de cada projeto."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Projeto</th>
                  <th className="px-5 py-3 font-medium">Equipe</th>
                  <th className="px-5 py-3 font-medium">Checklist</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((inst) => {
                  const total = inst.checklist?.length ?? 0;
                  const done = (inst.checklist ?? []).filter((c: { done: boolean }) => c.done).length;
                  return (
                    <tr key={inst.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 text-muted">
                        {formatDate(inst.data_agendada)} {inst.horario ? `· ${inst.horario}` : ""}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        <Link href={`/projetos/${inst.project_id}`} className="hover:underline">
                          {inst.projects?.nome ?? "Projeto"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{inst.equipe || "-"}</td>
                      <td className="px-5 py-3 text-muted">{done}/{total}</td>
                      <td className="px-5 py-3">
                        <Badge tone={INSTALACAO_TONE[inst.status as keyof typeof INSTALACAO_TONE]}>
                          {INSTALACAO_LABEL[inst.status as keyof typeof INSTALACAO_LABEL]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
