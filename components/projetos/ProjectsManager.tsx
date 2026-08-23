"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/database.types";
import { PROJECT_STAGES } from "@/lib/projetos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

type ProjectWithClient = Project & { clients: { nome: string } | null };
type Option = { id: string; nome: string };

const emptyForm = { client_id: "", nome: "", potencia_kwp: "", data_prevista_entrega: "" };

export function ProjectsManager({
  initialProjects,
  clients,
}: {
  initialProjects: ProjectWithClient[];
  clients: Option[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [projects, setProjects] = useState<ProjectWithClient[]>(initialProjects);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => projects.filter((p) => statusFilter === "todos" || p.status === statusFilter),
    [projects, statusFilter]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      setError("Selecione o cliente.");
      return;
    }
    setSaving(true);
    setError(null);

    const clientName = clients.find((c) => c.id === form.client_id)?.nome ?? "";

    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id: form.client_id,
        nome: form.nome || `Projeto ${clientName}`,
        potencia_kwp: form.potencia_kwp ? Number(form.potencia_kwp) : null,
        data_prevista_entrega: form.data_prevista_entrega || null,
      })
      .select("*, clients(nome)")
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProjects((prev) => [data as any as ProjectWithClient, ...prev]);
      setModalOpen(false);
      setForm(emptyForm);
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[220px]">
            <option value="todos">Todas as etapas</option>
            {PROJECT_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setError(null);
              setModalOpen(true);
            }}
          >
            + Novo projeto
          </Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum projeto encontrado"
            description="Crie um projeto manualmente ou converta uma proposta aprovada."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Projeto</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Potência</th>
                  <th className="px-5 py-3 font-medium">Etapa</th>
                  <th className="px-5 py-3 font-medium">Entrega prevista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const stage = PROJECT_STAGES.find((s) => s.value === p.status);
                  return (
                    <tr key={p.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 text-muted">#{p.numero}</td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        <Link href={`/projetos/${p.id}`} className="hover:underline">{p.nome}</Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{p.clients?.nome ?? "-"}</td>
                      <td className="px-5 py-3 text-muted">{p.potencia_kwp ? `${Number(p.potencia_kwp).toFixed(2)} kWp` : "-"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={stage?.tone}>{stage?.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(p.data_prevista_entrega)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo projeto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup label="Cliente" required>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Nome do projeto">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Sistema residencial - João Silva"
            />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Potência (kWp)">
              <Input type="number" step="0.01" value={form.potencia_kwp} onChange={(e) => setForm({ ...form, potencia_kwp: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Entrega prevista">
              <Input type="date" value={form.data_prevista_entrega} onChange={(e) => setForm({ ...form, data_prevista_entrega: e.target.value })} />
            </FieldGroup>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar projeto"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
