"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, Client, OrdemServico, OrdemServicoStatus } from "@/lib/database.types";
import {
  DEFAULT_ORDEM_CHECKLIST,
  ORDEM_PRIORIDADE_LABEL,
  ORDEM_PRIORIDADE_TONE,
  ORDEM_STATUS,
  ORDEM_STATUS_LABEL,
  ORDEM_STATUS_TONE,
  ORDEM_TIPO_LABEL,
  ORDEM_TIPO_TONE,
} from "@/lib/ordens";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export function OrdemServicoDetail({
  ordem,
  client,
  projectNome,
  plantNome,
}: {
  ordem: OrdemServico;
  client: Client | null;
  projectNome: string | null;
  plantNome: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<OrdemServicoStatus>(ordem.status);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    descricao: ordem.descricao ?? "",
    data_agendada: ordem.data_agendada ?? "",
    valor_servico: ordem.valor_servico !== null ? String(ordem.valor_servico) : "",
    forma_pagamento: ordem.forma_pagamento ?? "",
    observacoes: ordem.observacoes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const checklist: ChecklistItem[] =
    ordem.checklist.length > 0
      ? ordem.checklist
      : DEFAULT_ORDEM_CHECKLIST[ordem.tipo].map((item) => ({ item, done: false }));
  const [items, setItems] = useState<ChecklistItem[]>(checklist);
  const [assinatura, setAssinatura] = useState(ordem.assinatura_cliente ?? "");
  const [concluding, setConcluding] = useState(false);

  async function handleStatusChange(newStatus: OrdemServicoStatus) {
    setStatus(newStatus);
    await supabase.from("ordens_servico").update({ status: newStatus }).eq("id", ordem.id);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("ordens_servico")
      .update({
        descricao: form.descricao || null,
        data_agendada: form.data_agendada || null,
        valor_servico: form.valor_servico ? Number(form.valor_servico) : null,
        forma_pagamento: form.forma_pagamento || null,
        observacoes: form.observacoes || null,
      })
      .eq("id", ordem.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function toggleChecklist(index: number) {
    const next = items.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    setItems(next);
    await supabase.from("ordens_servico").update({ checklist: next }).eq("id", ordem.id);
    router.refresh();
  }

  async function handleConcluir() {
    const nome = assinatura.trim();
    if (!nome) return;
    setConcluding(true);
    await supabase
      .from("ordens_servico")
      .update({
        status: "concluida",
        assinatura_cliente: nome,
        concluida_em: new Date().toISOString(),
        data_conclusao: new Date().toISOString().slice(0, 10),
        checklist: items,
      })
      .eq("id", ordem.id);
    setConcluding(false);
    setStatus("concluida");
    router.refresh();
  }

  const doneCount = items.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`O.S. #${ordem.numero} — ${ordem.titulo}`}
          subtitle={client?.nome}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ORDEM_TIPO_TONE[ordem.tipo]}>{ORDEM_TIPO_LABEL[ordem.tipo]}</Badge>
              <Badge tone={ORDEM_PRIORIDADE_TONE[ordem.prioridade]}>{ORDEM_PRIORIDADE_LABEL[ordem.prioridade]}</Badge>
              <Badge tone={ORDEM_STATUS_TONE[status]}>{ORDEM_STATUS_LABEL[status]}</Badge>
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value as OrdemServicoStatus)}>
                {ORDEM_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          }
        />
        <CardBody className="space-y-2">
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            {client && (
              <Link href={`/clientes/${client.id}`} className="text-primary hover:underline">
                Ver cliente →
              </Link>
            )}
            {ordem.project_id && projectNome && (
              <Link href={`/projetos/${ordem.project_id}`} className="text-primary hover:underline">
                Projeto: {projectNome} →
              </Link>
            )}
            {ordem.plant_id && plantNome && (
              <Link href={`/usinas/${ordem.plant_id}`} className="text-primary hover:underline">
                Usina: {plantNome} →
              </Link>
            )}
          </div>
          {status === "concluida" && ordem.assinatura_cliente && (
            <p className="text-sm text-green-700">
              ✓ Concluída, confirmada por {ordem.assinatura_cliente}
              {ordem.concluida_em ? ` em ${formatDateTime(ordem.concluida_em)}` : ""}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Detalhes"
          action={
            !editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            )
          }
        />
        <CardBody className="space-y-4">
          {!editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Data de abertura" value={formatDate(ordem.data_abertura)} />
              <Info label="Data agendada" value={ordem.data_agendada ? formatDate(ordem.data_agendada) : null} />
              <Info label="Data de conclusão" value={ordem.data_conclusao ? formatDate(ordem.data_conclusao) : null} />
              <Info label="Valor do serviço" value={ordem.valor_servico ? formatCurrency(ordem.valor_servico) : null} />
              <Info label="Forma de pagamento" value={ordem.forma_pagamento} />
              <Info label="Descrição" value={ordem.descricao} className="sm:col-span-2 lg:col-span-3" />
              <Info label="Observações" value={ordem.observacoes} className="sm:col-span-2 lg:col-span-3" />
            </div>
          ) : (
            <>
              <FieldGroup label="Descrição">
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Data agendada">
                  <Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Valor do serviço">
                  <Input type="number" step="0.01" value={form.valor_servico} onChange={(e) => setForm({ ...form, valor_servico: e.target.value })} />
                </FieldGroup>
              </div>
              <FieldGroup label="Forma de pagamento">
                <Input value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Observações">
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </FieldGroup>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Checklist" subtitle={`${doneCount}/${items.length} concluídos`} />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {items.map((c, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={c.done} onChange={() => toggleChecklist(i)} />
                <span className={c.done ? "text-muted line-through" : "text-foreground"}>{c.item}</span>
              </label>
            ))}
          </div>

          {status !== "concluida" && (
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
              <Input
                placeholder="Nome de quem confirma a conclusão (cliente/técnico)"
                value={assinatura}
                onChange={(e) => setAssinatura(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleConcluir} disabled={concluding}>
                {concluding ? "Concluindo..." : "Confirmar conclusão"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}
