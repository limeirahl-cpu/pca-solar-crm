"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/database.types";
import { FUNIL_STAGES, TEMPERATURA_OPTIONS } from "@/lib/funil";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function FunilManager({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const stage of FUNIL_STAGES) map.set(stage.value, []);
    for (const lead of leads) {
      map.get(lead.status)?.push(lead);
    }
    return map;
  }, [leads]);

  async function moveLead(leadId: string, status: LeadStatus) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === status) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    await supabase.from("leads").update({ status }).eq("id", leadId);
    await supabase.from("interactions").insert({
      lead_id: leadId,
      tipo: "nota",
      descricao: `Etapa do funil alterada para "${FUNIL_STAGES.find((s) => s.value === status)?.label}" via funil visual.`,
    });
    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {FUNIL_STAGES.map((stage) => {
        const stageLeads = byStage.get(stage.value) ?? [];
        const isOver = dragOverStage === stage.value;
        return (
          <div
            key={stage.value}
            className={`flex w-72 shrink-0 flex-col rounded-xl border ${
              isOver ? "border-primary bg-primary/5" : "border-border bg-surface-2"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage.value);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage.value ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStage(null);
              const id = e.dataTransfer.getData("text/lead-id");
              if (id) moveLead(id, stage.value);
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {stage.label}
              </span>
              <span className="rounded-full bg-border px-2 py-0.5 text-[11px] font-semibold text-muted">
                {stageLeads.length}
              </span>
            </div>

            <div className="flex-1 space-y-2 p-2">
              {stageLeads.map((lead) => {
                const temp = TEMPERATURA_OPTIONS.find((t) => t.value === lead.temperatura);
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/lead-id", lead.id);
                      setDraggingId(lead.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`block rounded-lg border border-border bg-surface p-3 shadow-sm transition-opacity hover:border-primary/40 ${
                      draggingId === lead.id ? "opacity-40" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{lead.nome}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {[lead.cidade, lead.estado].filter(Boolean).join("/") || "Sem cidade"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(lead.valor_estimado)}
                      </span>
                      {temp && <Badge tone={temp.tone}>{temp.label}</Badge>}
                    </div>
                  </Link>
                );
              })}
              {stageLeads.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted">Nenhum lead aqui</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
