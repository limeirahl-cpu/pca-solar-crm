"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  ChecklistItem,
  Client,
  Homologacao,
  Instalacao,
  Project,
  ProjectStatus,
} from "@/lib/database.types";
import { PROJECT_STAGES, DEFAULT_PROJECT_CHECKLIST } from "@/lib/projetos";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import { HomologacaoSection } from "./HomologacaoSection";
import { InstalacaoSection } from "./InstalacaoSection";

export function ProjectDetail({
  project,
  client,
  homologacoes,
  instalacoes,
}: {
  project: Project;
  client: Client | null;
  homologacoes: Homologacao[];
  instalacoes: Instalacao[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    project.checklist.length > 0
      ? project.checklist
      : DEFAULT_PROJECT_CHECKLIST.map((item) => ({ item, done: false }))
  );
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(project.nome);
  const [potenciaKwp, setPotenciaKwp] = useState(project.potencia_kwp?.toString() ?? "");
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState(project.data_prevista_entrega ?? "");
  const [observacoes, setObservacoes] = useState(project.observacoes ?? "");
  const [saving, setSaving] = useState(false);

  const stage = PROJECT_STAGES.find((s) => s.value === status);
  const stageIndex = PROJECT_STAGES.findIndex((s) => s.value === status);

  async function handleStatusChange(newStatus: ProjectStatus) {
    setStatus(newStatus);
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
    router.refresh();
  }

  async function toggleChecklistItem(index: number) {
    const next = checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    setChecklist(next);
    await supabase.from("projects").update({ checklist: next }).eq("id", project.id);
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("projects")
      .update({
        nome,
        potencia_kwp: potenciaKwp ? Number(potenciaKwp) : null,
        data_prevista_entrega: dataPrevistaEntrega || null,
        observacoes: observacoes || null,
      })
      .eq("id", project.id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={project.nome}
          subtitle={client ? `Cliente: ${client.nome}` : "Sem cliente vinculado"}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {stage && <Badge tone={stage.tone}>{stage.label}</Badge>}
              <Select value={status} onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)} className="w-48">
                {PROJECT_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
              <Link href={`/estoque/reservas?novo=1&project_id=${project.id}`}>
                <Button size="sm" variant="outline">Reservar estoque</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Fechar" : "Editar"}
              </Button>
            </div>
          }
        />
        <CardBody className="space-y-4">
          {/* Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {PROJECT_STAGES.map((s, i) => (
              <div key={s.value} className="flex items-center">
                <div
                  className={`flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-medium ${
                    i <= stageIndex ? "bg-primary text-primary-foreground" : "bg-border text-muted"
                  }`}
                >
                  {i + 1}. {s.label}
                </div>
                {i < PROJECT_STAGES.length - 1 && <div className="h-px w-3 shrink-0 bg-border" />}
              </div>
            ))}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Info label="Potência" value={project.potencia_kwp ? `${Number(project.potencia_kwp).toFixed(2)} kWp` : null} />
              <Info label="Data da venda" value={formatDate(project.data_venda)} />
              <Info label="Entrega prevista" value={formatDate(project.data_prevista_entrega)} />
              {project.observacoes && (
                <Info label="Observações" value={project.observacoes} className="sm:col-span-3" />
              )}
              {client && (
                <Info
                  label="Cliente"
                  value={`${client.nome} · ${[client.cidade, client.estado].filter(Boolean).join("/")}`}
                  className="sm:col-span-3"
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <FieldGroup label="Nome do projeto">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Potência (kWp)">
                  <Input type="number" step="0.01" value={potenciaKwp} onChange={(e) => setPotenciaKwp(e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Entrega prevista">
                  <Input type="date" value={dataPrevistaEntrega} onChange={(e) => setDataPrevistaEntrega(e.target.value)} />
                </FieldGroup>
              </div>
              <FieldGroup label="Observações">
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Checklist do projeto" subtitle={`${doneCount}/${checklist.length} concluídos`} />
        <CardBody className="space-y-2">
          {checklist.map((item, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(i)} />
              <span className={item.done ? "text-muted line-through" : "text-foreground"}>{item.item}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      <HomologacaoSection projectId={project.id} homologacoes={homologacoes} />
      <InstalacaoSection projectId={project.id} clientId={project.client_id} instalacoes={instalacoes} />

      {(project.quote_id || project.proposal_id) && (
        <Card>
          <CardBody className="flex flex-wrap gap-3 text-sm">
            {project.quote_id && (
              <Link href={`/orcamentos/${project.quote_id}`} className="text-primary hover:underline">
                Ver orçamento de origem →
              </Link>
            )}
            {project.proposal_id && (
              <Link href={`/propostas/${project.proposal_id}`} className="text-primary hover:underline">
                Ver proposta de origem →
              </Link>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}
