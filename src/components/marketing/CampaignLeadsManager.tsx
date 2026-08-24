"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadOrigem } from "@/lib/database.types";
import { FUNIL_STAGE_LABEL, FUNIL_STAGE_TONE } from "@/lib/funil";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

const ORIGEM_LABEL: Record<LeadOrigem, string> = {
  site: "Site",
  indicacao: "Indicação",
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  whatsapp: "WhatsApp",
  outro: "Outro",
};

export type LeadWithCampaign = Lead & { marketing_campaigns: { nome: string } | null };
type Option = { id: string; nome: string };

export function CampaignLeadsManager({
  initialLeads,
  campaigns,
  defaultCampaignId,
}: {
  initialLeads: LeadWithCampaign[];
  campaigns: Option[];
  defaultCampaignId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [leads, setLeads] = useState<LeadWithCampaign[]>(initialLeads);
  const [filter, setFilter] = useState<string>(defaultCampaignId ?? "todas");

  const filtered = useMemo(() => {
    if (filter === "todas") return leads;
    if (filter === "sem_campanha") return leads.filter((l) => !l.campaign_id);
    return leads.filter((l) => l.campaign_id === filter);
  }, [leads, filter]);

  const valorTotal = useMemo(
    () => filtered.reduce((sum, l) => sum + (l.valor_estimado ?? 0), 0),
    [filtered]
  );

  async function atribuirCampanha(lead: LeadWithCampaign, campaignId: string) {
    const campanha = campaigns.find((c) => c.id === campaignId) ?? null;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? { ...l, campaign_id: campaignId || null, marketing_campaigns: campanha ? { nome: campanha.nome } : null }
          : l
      )
    );
    await supabase.from("leads").update({ campaign_id: campaignId || null }).eq("id", lead.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leads de campanhas</h1>
          <p className="text-sm text-muted">
            {filtered.length} lead(s) · {formatCurrency(valorTotal)} em valor estimado
          </p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64">
          <option value="todas">Todas as campanhas</option>
          <option value="sem_campanha">Sem campanha vinculada</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum lead nesta visão" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-5 py-3 font-medium">Origem</th>
                  <th className="px-5 py-3 font-medium">Etapa</th>
                  <th className="px-5 py-3 font-medium">Valor estimado</th>
                  <th className="px-5 py-3 font-medium">Criado em</th>
                  <th className="px-5 py-3 font-medium">Campanha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-black/[0.02]">
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/leads/${lead.id}`} className="hover:underline">
                        {lead.nome}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{ORIGEM_LABEL[lead.origem]}</td>
                    <td className="px-5 py-3">
                      <Badge tone={FUNIL_STAGE_TONE[lead.status]}>{FUNIL_STAGE_LABEL[lead.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {lead.valor_estimado ? formatCurrency(lead.valor_estimado) : "-"}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3">
                      <Select
                        value={lead.campaign_id ?? ""}
                        onChange={(e) => atribuirCampanha(lead, e.target.value)}
                        className="w-48"
                      >
                        <option value="">Sem campanha</option>
                        {campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
