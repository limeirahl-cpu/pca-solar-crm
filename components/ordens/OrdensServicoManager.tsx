"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, OrdemServico, OrdemServicoTipo } from "@/lib/database.types";
import {
  DEFAULT_ORDEM_CHECKLIST,
  ORDEM_PRIORIDADE,
  ORDEM_PRIORIDADE_LABEL,
  ORDEM_PRIORIDADE_TONE,
  ORDEM_STATUS,
  ORDEM_STATUS_LABEL,
  ORDEM_STATUS_TONE,
  ORDEM_TIPO,
  ORDEM_TIPO_LABEL,
  ORDEM_TIPO_TONE,
} from "@/lib/ordens";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

export type OrdemServicoWithClient = OrdemServico & { clients: { nome: string } | null };
type Option = { id: string; nome: string };

export function OrdensServicoManager({
  initialOrdens,
  clients,
  title,
  description,
  fixedTipo,
  prefillClientId,
  autoOpen,
}: {
  initialOrdens: OrdemServicoWithClient[];
  clients: Option[];
  title: string;
  description: string;
  fixedTipo?: OrdemServicoTipo;
  prefillClientId?: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [ordens, setOrdens] = useState<OrdemServicoWithClient[]>(initialOrdens);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpen));
  const [form, setForm] = useState({
    client_id: prefillClientId ?? "",
    tipo: fixedTipo ?? ("manutencao" as OrdemServicoTipo),
    titulo: "",
    descricao: "",
    prioridade: "media" as (typeof ORDEM_PRIORIDADE)[number]["value"],
    data_agendada: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => ordens.filter((o) => statusFilter === "todos" || o.status === statusFilter),
    [ordens, statusFilter]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) {
      setError("Selecione o cliente.");
      return;
    }
    if (!form.titulo.trim()) {
      setError("Descreva o título da O.S.");
      return;
    }
    setSaving(true);
    setError(null);

    const tipo = fixedTipo ?? form.tipo;
    const checklist: ChecklistItem[] = DEFAULT_ORDEM_CHECKLIST[tipo].map((item) => ({ item, done: false }));

    const { data, error: insertError } = await supabase
      .from("ordens_servico")
      .insert({
        client_id: form.client_id,
        tipo,
        titulo: form.titulo,
        descricao: form.descricao || null,
        prioridade: form.prioridade,
        data_agendada: form.data_agendada || null,
        checklist,
      })
      .select("*, clients(nome)")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOrdens((prev) => [data as any as OrdemServicoWithClient, ...prev]);
      setModalOpen(false);
      setForm({
        client_id: prefillClientId ?? "",
        tipo: fixedTipo ?? "manutencao",
        titulo: "",
        descricao: "",
        prioridade: "media",
        data_agendada: "",
      });
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
            <option value="todos">Todos os status</option>
            {ORDEM_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Nova O.S.
          </Button>
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma ordem de serviço"
            description="Abra a primeira O.S. para começar a acompanhar o atendimento."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nº</th>
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  {!fixedTipo && <th className="px-5 py-3 font-medium">Tipo</th>}
                  <th className="px-5 py-3 font-medium">Prioridade</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 text-muted">#{o.numero}</td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/ordens-servico/${o.id}`} className="hover:underline">
                        {o.titulo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{o.clients?.nome ?? "-"}</td>
                    {!fixedTipo && (
                      <td className="px-5 py-3">
                        <Badge tone={ORDEM_TIPO_TONE[o.tipo]}>{ORDEM_TIPO_LABEL[o.tipo]}</Badge>
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <Badge tone={ORDEM_PRIORIDADE_TONE[o.prioridade]}>{ORDEM_PRIORIDADE_LABEL[o.prioridade]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(o.data_agendada ?? o.data_abertura)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={ORDEM_STATUS_TONE[o.status]}>{ORDEM_STATUS_LABEL[o.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova ordem de serviço">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Cliente" required>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          {!fixedTipo && (
            <FieldGroup label="Tipo">
              <Select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as OrdemServicoTipo })}
              >
                {ORDEM_TIPO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FieldGroup>
          )}
          <FieldGroup label="Título" required>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Limpeza semestral" />
          </FieldGroup>
          <FieldGroup label="Descrição">
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Prioridade">
              <Select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value as typeof form.prioridade })}
              >
                {ORDEM_PRIORIDADE.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Data agendada">
              <Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} />
            </FieldGroup>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Abrir O.S."}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
