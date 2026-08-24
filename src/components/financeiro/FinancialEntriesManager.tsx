"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { FinancialCategoriaTipo, FinancialCategory, FinancialEntry, FinancialEntryStatus } from "@/lib/database.types";
import { FINANCIAL_STATUS, FINANCIAL_STATUS_LABEL, FINANCIAL_STATUS_TONE, isVencido } from "@/lib/financeiro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

export type EntryWithRelations = FinancialEntry & {
  clients: { nome: string } | null;
  suppliers: { nome: string } | null;
};
type Option = { id: string; nome: string };

export function FinancialEntriesManager({
  initialEntries,
  categories,
  clients,
  suppliers,
  projects,
  tipo,
  title,
  description,
  defaultClientId,
  defaultSupplierId,
  defaultProjectId,
  autoOpen,
}: {
  initialEntries: EntryWithRelations[];
  categories: FinancialCategory[];
  clients: Option[];
  suppliers: Option[];
  projects: Option[];
  tipo: FinancialCategoriaTipo;
  title: string;
  description: string;
  defaultClientId?: string;
  defaultSupplierId?: string;
  defaultProjectId?: string;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [entries, setEntries] = useState<EntryWithRelations[]>(initialEntries);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(Boolean(autoOpen));
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria_id: "",
    client_id: defaultClientId ?? "",
    supplier_id: defaultSupplierId ?? "",
    project_id: defaultProjectId ?? "",
    data_vencimento: new Date().toISOString().slice(0, 10),
    forma_pagamento: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriaOptions = categories.filter((c) => c.tipo === tipo);

  const filtered = useMemo(
    () => entries.filter((e) => statusFilter === "todos" || e.status === statusFilter),
    [entries, statusFilter]
  );

  const totalPendente = useMemo(
    () => entries.filter((e) => e.status === "pendente").reduce((sum, e) => sum + e.valor, 0),
    [entries]
  );

  function openNew() {
    setForm({
      descricao: "",
      valor: "",
      categoria_id: "",
      client_id: defaultClientId ?? "",
      supplier_id: defaultSupplierId ?? "",
      project_id: defaultProjectId ?? "",
      data_vencimento: new Date().toISOString().slice(0, 10),
      forma_pagamento: "",
      observacoes: "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim() || !form.valor) {
      setError("Preencha descrição e valor.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("financial_entries")
      .insert({
        tipo,
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria_id: form.categoria_id || null,
        client_id: tipo === "receita" ? form.client_id || null : null,
        supplier_id: tipo === "despesa" ? form.supplier_id || null : null,
        project_id: form.project_id || null,
        data_vencimento: form.data_vencimento,
        forma_pagamento: form.forma_pagamento || null,
        observacoes: form.observacoes || null,
      })
      .select("*, clients(nome), suppliers(nome)")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEntries((prev) => [data as any as EntryWithRelations, ...prev]);
      setModalOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function markAsPaid(entry: EntryWithRelations) {
    const hoje = new Date().toISOString().slice(0, 10);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "pago", data_pagamento: hoje } : e)));
    await supabase.from("financial_entries").update({ status: "pago", data_pagamento: hoje }).eq("id", entry.id);
    router.refresh();
  }

  async function updateStatus(entry: EntryWithRelations, status: FinancialEntryStatus) {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status } : e)));
    await supabase.from("financial_entries").update({ status }).eq("id", entry.id);
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
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="todos">Todos os status</option>
            {FINANCIAL_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <Button size="sm" onClick={openNew}>+ Novo lançamento</Button>
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted">
          Pendente: <span className="font-semibold text-foreground">{formatCurrency(totalPendente)}</span>
        </p>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento"
            description="Registre o primeiro lançamento para começar a acompanhar."
            action={<Button onClick={openNew}>+ Novo lançamento</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">{tipo === "receita" ? "Cliente" : "Fornecedor"}</th>
                  <th className="px-5 py-3 font-medium">Vencimento</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((entry) => {
                  const vencido = isVencido(entry.data_vencimento, entry.status);
                  return (
                    <tr key={entry.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">{entry.descricao}</td>
                      <td className="px-5 py-3 text-muted">
                        {tipo === "receita" ? entry.clients?.nome ?? "-" : entry.suppliers?.nome ?? "-"}
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(entry.data_vencimento)}</td>
                      <td className="px-5 py-3 text-muted">{formatCurrency(entry.valor)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Badge tone={FINANCIAL_STATUS_TONE[entry.status]}>{FINANCIAL_STATUS_LABEL[entry.status]}</Badge>
                          {vencido && <Badge tone="red">Vencido</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {entry.status === "pendente" ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => markAsPaid(entry)}>
                              {tipo === "receita" ? "Marcar recebido" : "Marcar pago"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(entry, "cancelado")}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">
                            {entry.data_pagamento ? formatDate(entry.data_pagamento) : "-"}
                          </span>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Novo lançamento — ${tipo === "receita" ? "a receber" : "a pagar"}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FieldGroup label="Descrição" required>
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
          <FieldGroup label="Categoria">
            <Select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
              <option value="">Sem categoria</option>
              {categoriaOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          {tipo === "receita" ? (
            <FieldGroup label="Cliente">
              <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Sem cliente vinculado</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </FieldGroup>
          ) : (
            <FieldGroup label="Fornecedor">
              <Select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">Sem fornecedor vinculado</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </Select>
            </FieldGroup>
          )}
          <FieldGroup label="Projeto (opcional)">
            <Select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">Nenhum projeto vinculado</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Forma de pagamento">
            <Input value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} placeholder="Pix, boleto, cartão..." />
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
