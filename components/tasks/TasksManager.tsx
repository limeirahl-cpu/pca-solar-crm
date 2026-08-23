"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { cn, formatDate } from "@/lib/utils";

type Option = { id: string; nome: string };

const emptyForm = {
  titulo: "",
  descricao: "",
  data_vencimento: "",
  lead_id: "",
  client_id: "",
};

export function TasksManager({
  initialTasks,
  leads,
  clients,
}: {
  initialTasks: Task[];
  leads: Option[];
  clients: Option[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const visible = useMemo(
    () => tasks.filter((t) => showDone || !t.concluida),
    [tasks, showDone]
  );

  function relatedName(task: Task) {
    if (task.lead_id) return leads.find((l) => l.id === task.lead_id)?.nome;
    if (task.client_id) return clients.find((c) => c.id === task.client_id)?.nome;
    return null;
  }

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, concluida: !t.concluida } : t)));
    await supabase.from("tasks").update({ concluida: !task.concluida }).eq("id", task.id);
    router.refresh();
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Excluir a tarefa "${task.titulo}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await supabase.from("tasks").delete().eq("id", task.id);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        titulo: form.titulo,
        descricao: form.descricao || null,
        data_vencimento: form.data_vencimento || null,
        lead_id: form.lead_id || null,
        client_id: form.client_id || null,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks((prev) => [...prev, data]);
      setModalOpen(false);
      setForm(emptyForm);
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            Mostrar concluídas
          </label>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setModalOpen(true);
            }}
          >
            + Nova tarefa
          </Button>
        </div>
      </Card>

      <Card>
        {visible.length === 0 ? (
          <EmptyState title="Nenhuma tarefa por aqui" />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.concluida}
                    onChange={() => handleToggle(task)}
                    className="mt-1"
                  />
                  <div>
                    <p className={cn("text-sm font-medium text-foreground", task.concluida && "line-through text-muted")}>
                      {task.titulo}
                    </p>
                    {task.descricao && <p className="text-xs text-muted">{task.descricao}</p>}
                    {relatedName(task) && (
                      <p className="text-xs text-primary">{relatedName(task)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{formatDate(task.data_vencimento)}</span>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(task)}>
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova tarefa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup label="Título" required>
            <Input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Descrição">
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Data de vencimento">
            <Input
              type="date"
              value={form.data_vencimento}
              onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
            />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Vincular a lead">
              <Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value, client_id: "" })}>
                <option value="">Nenhum</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Vincular a cliente">
              <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, lead_id: "" })}>
                <option value="">Nenhum</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>

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
