"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MarketingCampaign, MarketingCampaignCanal, MarketingCampaignStatus } from "@/lib/database.types";
import { CAMPAIGN_CANAL, CAMPAIGN_CANAL_LABEL, CAMPAIGN_STATUS, CAMPAIGN_STATUS_LABEL, CAMPAIGN_STATUS_TONE } from "@/lib/marketing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

const emptyForm = {
  nome: "",
  objetivo: "",
  canal: "instagram" as MarketingCampaignCanal,
  status: "planejada" as MarketingCampaignStatus,
  data_inicio: "",
  data_fim: "",
  orcamento: "",
  observacoes: "",
};

export function CampaignsManager({ initialCampaigns }: { initialCampaigns: MarketingCampaign[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ativas = useMemo(() => campaigns.filter((c) => c.status === "ativa").length, [campaigns]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: MarketingCampaign) {
    setEditingId(c.id);
    setForm({
      nome: c.nome,
      objetivo: c.objetivo ?? "",
      canal: c.canal,
      status: c.status,
      data_inicio: c.data_inicio ?? "",
      data_fim: c.data_fim ?? "",
      orcamento: c.orcamento?.toString() ?? "",
      observacoes: c.observacoes ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError("Informe o nome da campanha.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nome: form.nome,
      objetivo: form.objetivo || null,
      canal: form.canal,
      status: form.status,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      orcamento: form.orcamento ? Number(form.orcamento) : null,
      observacoes: form.observacoes || null,
    };

    if (editingId) {
      const { data, error: updError } = await supabase
        .from("marketing_campaigns")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();
      if (updError) {
        setError(updError.message);
      } else if (data) {
        setCampaigns((prev) => prev.map((c) => (c.id === editingId ? data : c)));
        setModalOpen(false);
        router.refresh();
      }
    } else {
      const { data, error: insError } = await supabase.from("marketing_campaigns").insert(payload).select().single();
      if (insError) {
        setError(insError.message);
      } else if (data) {
        setCampaigns((prev) => [data, ...prev]);
        setModalOpen(false);
        router.refresh();
      }
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Campanhas</h1>
          <p className="text-sm text-muted">{ativas} campanha(s) ativa(s) no momento.</p>
        </div>
        <Button onClick={openNew}>+ Nova campanha</Button>
      </div>

      <Card>
        {campaigns.length === 0 ? (
          <EmptyState
            title="Nenhuma campanha cadastrada"
            description="Cadastre campanhas para organizar criativos, posts e leads por origem."
            action={<Button onClick={openNew}>+ Nova campanha</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Campanha</th>
                  <th className="px-5 py-3 font-medium">Canal</th>
                  <th className="px-5 py-3 font-medium">Período</th>
                  <th className="px-5 py-3 font-medium">Orçamento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">{c.nome}</td>
                    <td className="px-5 py-3 text-muted">{CAMPAIGN_CANAL_LABEL[c.canal]}</td>
                    <td className="px-5 py-3 text-muted">
                      {c.data_inicio ? formatDate(c.data_inicio) : "-"} — {c.data_fim ? formatDate(c.data_fim) : "-"}
                    </td>
                    <td className="px-5 py-3 text-muted">{c.orcamento ? formatCurrency(c.orcamento) : "-"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{CAMPAIGN_STATUS_LABEL[c.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                        <Link href={`/marketing/leads?campaign_id=${c.id}`}>
                          <Button size="sm" variant="ghost">
                            Ver leads
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar campanha" : "Nova campanha"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-danger">{error}</p>}
          <FieldGroup label="Nome" required>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Objetivo">
            <Input value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} placeholder="Ex: gerar leads qualificados na região" />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Canal">
              <Select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value as MarketingCampaignCanal })}>
                {CAMPAIGN_CANAL.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MarketingCampaignStatus })}>
                {CAMPAIGN_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Início">
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </FieldGroup>
            <FieldGroup label="Fim">
              <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
            </FieldGroup>
          </div>
          <FieldGroup label="Orçamento (R$)">
            <Input type="number" step="0.01" value={form.orcamento} onChange={(e) => setForm({ ...form, orcamento: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FieldGroup>
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
