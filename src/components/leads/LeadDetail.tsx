"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Interaction, InteractionTipo, Lead, LeadStatus, Task } from "@/lib/database.types";
import { FUNIL_STAGES, TEMPERATURA_OPTIONS } from "@/lib/funil";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, Input } from "@/components/ui/Field";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";

const INTERACTION_LABEL: Record<InteractionTipo, string> = {
  nota: "Nota",
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "Email",
  visita: "Visita",
};

export function LeadDetail({
  lead,
  interactions,
  tasks,
}: {
  lead: Lead;
  interactions: Interaction[];
  tasks: Task[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [current, setCurrent] = useState(lead);
  const [items, setItems] = useState<Interaction[]>(interactions);
  const [noteType, setNoteType] = useState<InteractionTipo>("nota");
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [converting, setConverting] = useState(false);

  const stageMeta = FUNIL_STAGES.find((s) => s.value === current.status);
  const temperaturaMeta = TEMPERATURA_OPTIONS.find((t) => t.value === current.temperatura);

  async function handleStatusChange(status: LeadStatus) {
    setSavingStatus(true);
    setCurrent((prev) => ({ ...prev, status }));
    await supabase.from("leads").update({ status }).eq("id", lead.id);
    await supabase.from("interactions").insert({
      lead_id: lead.id,
      tipo: "nota",
      descricao: `Etapa do funil alterada para "${FUNIL_STAGES.find((s) => s.value === status)?.label}".`,
    });
    setSavingStatus(false);
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setAddingNote(true);
    const { data, error } = await supabase
      .from("interactions")
      .insert({ lead_id: lead.id, tipo: noteType, descricao: noteText })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setNoteText("");
    }
    setAddingNote(false);
    router.refresh();
  }

  async function handleConvert() {
    setConverting(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        lead_id: current.id,
        nome: current.nome,
        email: current.email,
        telefone: current.telefone,
        cidade: current.cidade,
        estado: current.estado,
        endereco: current.endereco,
        cep: current.cep,
        documento: current.cpf_cnpj,
        tipo_pessoa: "fisica",
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("leads").update({ status: "pos_venda" }).eq("id", current.id);
      router.push(`/clientes/${data.id}`);
      return;
    }
    setConverting(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={current.nome}
          subtitle={`Lead desde ${formatDate(current.created_at)} · origem ${current.origem}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {stageMeta && <Badge tone={stageMeta.tone}>{stageMeta.label}</Badge>}
              {temperaturaMeta && <Badge tone={temperaturaMeta.tone}>{temperaturaMeta.label}</Badge>}
              <Select
                value={current.status}
                disabled={savingStatus}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="w-48"
              >
                {FUNIL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="secondary" disabled={converting} onClick={handleConvert}>
                {converting ? "Convertendo..." : "Converter em cliente"}
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Telefone" value={current.telefone} />
            <Info label="WhatsApp" value={current.whatsapp} />
            <Info label="Email" value={current.email} />
            <Info label="CPF/CNPJ" value={current.cpf_cnpj} />
            <Info label="Endereço" value={current.endereco} />
            <Info label="Cidade/UF" value={[current.cidade, current.estado].filter(Boolean).join("/")} />
            <Info label="CEP" value={current.cep} />
            <Info label="Campanha" value={current.campanha} />
            <Info label="Anúncio" value={current.anuncio} />
            <Info label="Consumo médio" value={current.consumo_kwh ? `${current.consumo_kwh} kWh/mês` : null} />
            <Info label="Valor estimado" value={current.valor_estimado ? formatCurrency(current.valor_estimado) : null} />
            <Info label="Probabilidade" value={current.probabilidade !== null ? `${current.probabilidade}%` : null} />
            <Info label="Próximo contato" value={current.proximo_contato ? formatDate(current.proximo_contato) : null} />
            <Info label="Observações" value={current.observacoes} className="sm:col-span-2 lg:col-span-3" />
          </div>
        </CardBody>
      </Card>

      {tasks.length > 0 && (
        <Card>
          <CardHeader title="Tarefas vinculadas" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-foreground">{t.titulo}</span>
                  <span className="text-xs text-muted">{formatDate(t.data_vencimento)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Histórico / timeline" subtitle="Ligações, WhatsApp, e-mails, visitas e notas" />
        <CardBody>
          <form onSubmit={handleAddNote} className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as InteractionTipo)}
              className="sm:max-w-[160px]"
            >
              {Object.entries(INTERACTION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Descreva o contato..."
              className="flex-1"
            />
            <Button type="submit" disabled={addingNote}>
              Adicionar
            </Button>
          </form>

          {items.length === 0 ? (
            <EmptyState title="Nenhuma interação registrada ainda" />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {initials(INTERACTION_LABEL[item.tipo])}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{item.descricao}</p>
                    <p className="text-xs text-muted">
                      {INTERACTION_LABEL[item.tipo]} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
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
