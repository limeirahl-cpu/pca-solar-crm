"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadOrigem, LeadStatus } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_OPTIONS: { value: LeadStatus; label: string; tone: "neutral" | "amber" | "green" | "red" | "blue" | "teal" }[] = [
  { value: "novo", label: "Novo", tone: "blue" },
  { value: "contatado", label: "Contatado", tone: "amber" },
  { value: "orcamento_enviado", label: "Orçamento enviado", tone: "teal" },
  { value: "negociacao", label: "Negociação", tone: "amber" },
  { value: "fechado", label: "Fechado", tone: "green" },
  { value: "perdido", label: "Perdido", tone: "red" },
];

const ORIGEM_OPTIONS: { value: LeadOrigem; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "indicacao", label: "Indicação" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
];

const emptyForm = {
  nome: "",
  telefone: "",
  email: "",
  origem: "site" as LeadOrigem,
  status: "novo" as LeadStatus,
  cidade: "",
  estado: "",
  consumo_kwh: "",
  valor_estimado: "",
  observacoes: "",
};

export function LeadsManager({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.nome.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (lead.telefone ?? "").includes(search);
      const matchesStatus = statusFilter === "todos" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditing(lead);
    setForm({
      nome: lead.nome,
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",
      origem: lead.origem,
      status: lead.status,
      cidade: lead.cidade ?? "",
      estado: lead.estado ?? "",
      consumo_kwh: lead.consumo_kwh?.toString() ?? "",
      valor_estimado: lead.valor_estimado?.toString() ?? "",
      observacoes: lead.observacoes ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      nome: form.nome,
      telefone: form.telefone || null,
      email: form.email || null,
      origem: form.origem,
      status: form.status,
      cidade: form.cidade || null,
      estado: form.estado || null,
      consumo_kwh: form.consumo_kwh ? Number(form.consumo_kwh) : null,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      observacoes: form.observacoes || null,
    };

    if (editing) {
      const { data, error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (error) {
        setError(error.message);
      } else if (data) {
        setLeads((prev) => prev.map((l) => (l.id === data.id ? data : l)));
        setModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) {
        setError(error.message);
      } else if (data) {
        setLeads((prev) => [data, ...prev]);
        setModalOpen(false);
      }
    }

    setSaving(false);
    router.refresh();
  }

  async function handleStatusChange(lead: Lead, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    await supabase.from("leads").update({ status }).eq("id", lead.id);
    router.refresh();
  }

  async function handleDelete(lead: Lead) {
    if (!confirm(`Excluir o lead "${lead.nome}"?`)) return;
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    await supabase.from("leads").delete().eq("id", lead.id);
    router.refresh();
  }

  async function handleConvert(lead: Lead) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        lead_id: lead.id,
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        cidade: lead.cidade,
        estado: lead.estado,
        tipo_pessoa: "fisica",
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("leads").update({ status: "fechado" }).eq("id", lead.id);
      router.push(`/clientes/${data.id}`);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[200px]">
              <option value="todos">Todos os status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openNew}>+ Novo lead</Button>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum lead encontrado"
            description="Cadastre um novo lead ou ajuste os filtros de busca."
            action={<Button onClick={openNew}>+ Novo lead</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Origem</th>
                  <th className="px-5 py-3 font-medium">Cidade/UF</th>
                  <th className="px-5 py-3 font-medium">Valor est.</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Criado</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead) => {
                  const statusMeta = STATUS_OPTIONS.find((s) => s.value === lead.status);
                  return (
                    <tr key={lead.id} className="hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-medium text-foreground">{lead.nome}</td>
                      <td className="px-5 py-3 text-muted">
                        <div>{lead.telefone || "-"}</div>
                        <div className="text-xs">{lead.email || ""}</div>
                      </td>
                      <td className="px-5 py-3 text-muted capitalize">{lead.origem}</td>
                      <td className="px-5 py-3 text-muted">
                        {[lead.cidade, lead.estado].filter(Boolean).join("/") || "-"}
                      </td>
                      <td className="px-5 py-3 text-muted">{formatCurrency(lead.valor_estimado)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value as LeadStatus)}
                          className="rounded-md border-0 bg-transparent text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1">
                          <Badge tone={statusMeta?.tone}>{statusMeta?.label}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(lead.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(lead)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleConvert(lead)}>
                            Converter
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(lead)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar lead" : "Novo lead"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup label="Nome" required>
            <Input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Telefone">
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Origem">
              <Select value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value as LeadOrigem })}>
                {ORIGEM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Cidade">
              <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="UF">
              <Input
                maxLength={2}
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Consumo médio (kWh/mês)">
              <Input
                type="number"
                step="0.01"
                value={form.consumo_kwh}
                onChange={(e) => setForm({ ...form, consumo_kwh: e.target.value })}
              />
            </FieldGroup>
            <FieldGroup label="Valor estimado (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valor_estimado}
                onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Observações">
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </FieldGroup>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
