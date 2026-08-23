"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CheckinStatus, PostSaleCheckin } from "@/lib/database.types";
import {
  CHECKIN_ETAPA_LABEL,
  CHECKIN_STATUS,
  CHECKIN_STATUS_LABEL,
  CHECKIN_STATUS_TONE,
  isCheckinAtrasado,
} from "@/lib/monitoramento";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";

export type CheckinWithRefs = PostSaleCheckin & {
  projects: { nome: string } | null;
  clients: { nome: string } | null;
};

export function PostSaleChecklist({
  initialCheckins,
  defaultClientId,
  defaultProjectId,
}: {
  initialCheckins: CheckinWithRefs[];
  defaultClientId?: string;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [checkins, setCheckins] = useState<CheckinWithRefs[]>(initialCheckins);
  const [filter, setFilter] = useState<"atrasados" | "pendentes" | "concluidos" | "todos">(
    defaultClientId || defaultProjectId ? "todos" : "atrasados"
  );
  const [active, setActive] = useState<CheckinWithRefs | null>(null);
  const [form, setForm] = useState({
    status: "realizado" as CheckinStatus,
    observacoes: "",
    realizado_em: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    let list = checkins;
    if (defaultClientId) list = list.filter((c) => c.client_id === defaultClientId);
    if (defaultProjectId) list = list.filter((c) => c.project_id === defaultProjectId);
    if (filter === "atrasados") return list.filter((c) => isCheckinAtrasado(c.data_prevista, c.status));
    if (filter === "pendentes") return list.filter((c) => c.status === "pendente");
    if (filter === "concluidos") return list.filter((c) => c.status !== "pendente");
    return list;
  }, [checkins, filter, defaultClientId, defaultProjectId]);

  const atrasadosCount = checkins.filter((c) => isCheckinAtrasado(c.data_prevista, c.status)).length;
  const pendentesCount = checkins.filter((c) => c.status === "pendente").length;

  function openModal(checkin: CheckinWithRefs) {
    setActive(checkin);
    setForm({
      status: "realizado",
      observacoes: checkin.observacoes ?? "",
      realizado_em: new Date().toISOString().slice(0, 10),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setSaving(true);
    const realizado_em = form.status === "pendente" ? null : form.realizado_em;
    const { error } = await supabase
      .from("post_sale_checkins")
      .update({ status: form.status, observacoes: form.observacoes || null, realizado_em })
      .eq("id", active.id);
    if (!error) {
      setCheckins((prev) =>
        prev.map((c) =>
          c.id === active.id ? { ...c, status: form.status, observacoes: form.observacoes || null, realizado_em } : c
        )
      );
      setActive(null);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Pós-venda</h1>
        <p className="text-sm text-muted">
          Checklist de contato automático D+1 a D+365, gerado quando o projeto chega à etapa de entrega.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Atrasados</p>
          <p className="mt-1 text-2xl font-semibold text-danger">{atrasadosCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Pendentes</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{pendentesCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["atrasados", "pendentes", "concluidos", "todos"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-stone-100 text-stone-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState title="Nenhum checkin nesta visão" />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((c) => {
              const atrasado = isCheckinAtrasado(c.data_prevista, c.status);
              return (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{CHECKIN_ETAPA_LABEL[c.etapa]}</Badge>
                      <Badge tone={CHECKIN_STATUS_TONE[c.status]}>{CHECKIN_STATUS_LABEL[c.status]}</Badge>
                      {atrasado && <Badge tone="red">Atrasado</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{c.descricao}</p>
                    <p className="text-xs text-muted">
                      {c.clients?.nome ?? "Cliente"} · {c.projects?.nome ?? "Projeto"} · Previsto:{" "}
                      {formatDate(c.data_prevista)}
                      {c.realizado_em ? ` · Realizado: ${formatDate(c.realizado_em)}` : ""}
                    </p>
                    {c.observacoes && <p className="mt-1 text-xs text-muted">Obs: {c.observacoes}</p>}
                    <Link href={`/projetos`} className="text-xs text-primary hover:underline">
                      Ver projetos →
                    </Link>
                  </div>
                  {c.status === "pendente" && (
                    <Button size="sm" variant="secondary" onClick={() => openModal(c)}>
                      Registrar contato
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={active !== null} onClose={() => setActive(null)} title="Registrar contato de pós-venda">
        <form onSubmit={handleSubmit} className="space-y-3">
          <FieldGroup label="Resultado do contato">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CheckinStatus })}>
              {CHECKIN_STATUS.filter((s) => s.value !== "pendente").map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Data do contato">
            <Input
              type="date"
              value={form.realizado_em}
              onChange={(e) => setForm({ ...form, realizado_em: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setActive(null)}>
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
