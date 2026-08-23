"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, Instalacao, InstalacaoStatus } from "@/lib/database.types";
import { INSTALACAO_STATUS, INSTALACAO_LABEL, INSTALACAO_TONE, DEFAULT_INSTALACAO_CHECKLIST } from "@/lib/projetos";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime } from "@/lib/utils";

const emptyForm = { equipe: "", data_agendada: "", horario: "", observacoes: "" };

export function InstalacaoSection({
  projectId,
  clientId,
  instalacoes,
}: {
  projectId: string;
  clientId: string;
  instalacoes: Instalacao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState(instalacoes);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [assinaturaDrafts, setAssinaturaDrafts] = useState<Record<string, string>>({});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const checklist: ChecklistItem[] = DEFAULT_INSTALACAO_CHECKLIST.map((item) => ({ item, done: false }));
    const { data, error } = await supabase
      .from("instalacoes")
      .insert({
        project_id: projectId,
        client_id: clientId,
        equipe: form.equipe || null,
        data_agendada: form.data_agendada || null,
        horario: form.horario || null,
        observacoes: form.observacoes || null,
        checklist,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setCreating(false);
      setForm(emptyForm);
    }
    setSaving(false);
    router.refresh();
  }

  async function updateStatus(inst: Instalacao, status: InstalacaoStatus) {
    setItems((prev) => prev.map((it) => (it.id === inst.id ? { ...it, status } : it)));
    await supabase.from("instalacoes").update({ status }).eq("id", inst.id);
    router.refresh();
  }

  async function toggleChecklist(inst: Instalacao, index: number) {
    const next = inst.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    setItems((prev) => prev.map((it) => (it.id === inst.id ? { ...it, checklist: next } : it)));
    await supabase.from("instalacoes").update({ checklist: next }).eq("id", inst.id);
    router.refresh();
  }

  async function handleConcluir(inst: Instalacao) {
    const nome = assinaturaDrafts[inst.id]?.trim();
    if (!nome) return;
    const { data, error } = await supabase
      .from("instalacoes")
      .update({ status: "concluida", assinatura_cliente: nome, concluida_em: new Date().toISOString() })
      .eq("id", inst.id)
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => prev.map((it) => (it.id === inst.id ? data : it)));
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Instalação"
        subtitle="Agenda e checklist de execução em campo"
        action={
          !creating && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              + Agendar instalação
            </Button>
          )
        }
      />
      <CardBody className="space-y-4">
        {creating && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border p-4">
            <FieldGroup label="Equipe responsável">
              <Input value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="Nomes dos instaladores" />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Data agendada">
                <Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Horário">
                <Input value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="08:00" />
              </FieldGroup>
            </div>
            <FieldGroup label="Observações">
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Agendar"}</Button>
            </div>
          </form>
        )}

        {items.length === 0 && !creating ? (
          <EmptyState title="Nenhuma instalação agendada ainda" />
        ) : (
          items.map((inst) => {
            const doneCount = inst.checklist.filter((c) => c.done).length;
            return (
              <div key={inst.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(inst.data_agendada)} {inst.horario ? `às ${inst.horario}` : ""}
                    {inst.equipe ? ` · ${inst.equipe}` : ""}
                  </p>
                  <Select
                    value={inst.status}
                    onChange={(e) => updateStatus(inst, e.target.value as InstalacaoStatus)}
                    className="w-40"
                  >
                    {INSTALACAO_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                </div>

                <p className="mb-1 text-xs text-muted">
                  Checklist: {doneCount}/{inst.checklist.length} ·{" "}
                  <Badge tone={INSTALACAO_TONE[inst.status]}>{INSTALACAO_LABEL[inst.status]}</Badge>
                </p>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {inst.checklist.map((c, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={c.done} onChange={() => toggleChecklist(inst, i)} />
                      <span className={c.done ? "text-muted line-through" : "text-foreground"}>{c.item}</span>
                    </label>
                  ))}
                </div>

                {inst.observacoes && <p className="mt-2 text-xs text-muted">{inst.observacoes}</p>}

                {inst.status === "concluida" && inst.assinatura_cliente ? (
                  <p className="mt-3 text-xs text-green-700">
                    ✓ Concluída, confirmada por {inst.assinatura_cliente}
                    {inst.concluida_em ? ` em ${formatDateTime(inst.concluida_em)}` : ""}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
                    <Input
                      placeholder="Nome de quem confirma a conclusão (cliente/técnico)"
                      value={assinaturaDrafts[inst.id] ?? ""}
                      onChange={(e) => setAssinaturaDrafts((prev) => ({ ...prev, [inst.id]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button size="sm" variant="secondary" onClick={() => handleConcluir(inst)}>
                      Confirmar conclusão
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
