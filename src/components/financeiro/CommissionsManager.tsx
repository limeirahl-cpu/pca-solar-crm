"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FinancialEntry, FinancialEntryStatus } from "@/lib/database.types";
import { FINANCIAL_STATUS_LABEL, FINANCIAL_STATUS_TONE, isVencido } from "@/lib/financeiro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

export type CommissionEntry = FinancialEntry & { profiles: { full_name: string } | null };
type Option = { id: string; nome: string };
type VendedorOption = { id: string; full_name: string };

export function CommissionsManager({
  initialEntries,
  vendedores,
  projects,
  defaultProjectId,
  autoOpen,
}: {
  initialEntries: CommissionEntry[];
  vendedores: VendedorOption[];
  projects: Option[];
  defaultProjectId?: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [entries, setEntries] = useState(initialEntries);
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpen));
  const [form, setForm] = useState({
    vendedor_id: "",
    descricao: "Comissão de venda",
    valor: "",
    project_id: defaultProjectId ?? "",
    data_vencimento: new Date().toISOString().slice(0, 10),
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPendente = useMemo(
    () => entries.filter((e) => e.status === "pendente").reduce((sum, e) => sum + e.valor, 0),
    [entries]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendedor_id) {
      setError("Selecione o vendedor.");
      return;
    }
    if (!form.valor) {
      setError("Informe o valor da comissão.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("financial_entries")
      .insert({
        tipo: "despesa",
        descricao: form.descricao,
        valor: Number(form.valor),
        vendedor_id: form.vendedor_id,
        project_id: form.project_id || null,
        data_vencimento: form.data_vencimento,
        observacoes: form.observacoes || null,
      })
      .select("*, profiles(full_name)")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEntries((prev) => [data as any as CommissionEntry, ...prev]);
      setModalOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function updateStatus(entry: CommissionEntry, status: FinancialEntryStatus) {
    const data_pagamento = status === "pago" ? new Date().toISOString().slice(0, 10) : entry.data_pagamento;
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status, data_pagamento } : e)));
    await supabase.from("financial_entries").update({ status, data_pagamento }).eq("id", entry.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Comissões</h1>
          <p className="text-sm text-muted">Comissões de venda por vendedor, lançadas como despesa financeira.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Nova comissão</Button>
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted">
          Pendente: <span className="font-semibold text-foreground">{formatCurrency(totalPendente)}</span>
        </p>
      </Card>

      <Card>
        {entries.length === 0 ? (
          <EmptyState
            title="Nenhuma comissão registrada"
            description="Registre a comissão de um vendedor após o fechamento de uma venda."
            action={<Button onClick={() => setModalOpen(true)}>+ Nova comissão</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Vendedor</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Vencimento</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => {
                  const vencido = isVencido(entry.data_vencimento, entry.status);
                  return (
                    <tr key={entry.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">{entry.profiles?.full_name ?? "-"}</td>
                      <td className="px-5 py-3 text-muted">{entry.descricao}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(entry.data_vencimento)}</td>
                      <td className="px-5 py-3 text-muted">{formatCurrency(entry.valor)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={FINANCIAL_STATUS_TONE[entry.status]}>{FINANCIAL_STATUS_LABEL[entry.status]}</Badge>
                          {vencido && <Badge tone="red">Vencida</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {entry.status === "pendente" && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(entry, "pago")}>
                            Marcar como paga
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova comissão">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Vendedor" required>
            <Select value={form.vendedor_id} onChange={(e) => setForm({ ...form, vendedor_id: e.target.value })}>
              <option value="">Selecione...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.full_name}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Descrição">
            <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Valor" required>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Vencimento">
              <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
            </FieldGroup>
          </div>
          <FieldGroup label="Projeto (opcional)">
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Nenhum projeto vinculado</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
