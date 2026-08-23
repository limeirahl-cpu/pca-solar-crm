import type { LeadStatus } from "@/lib/database.types";

export type BadgeTone = "neutral" | "amber" | "green" | "red" | "blue" | "teal";

export type FunilStage = {
  value: LeadStatus;
  label: string;
  tone: BadgeTone;
};

/** As 13 etapas do funil comercial + "perdido", na ordem do roadmap. */
export const FUNIL_STAGES: FunilStage[] = [
  { value: "novo", label: "Novo lead", tone: "blue" },
  { value: "primeiro_contato", label: "Primeiro contato", tone: "blue" },
  { value: "qualificacao", label: "Qualificação", tone: "teal" },
  { value: "visita_agendada", label: "Visita agendada", tone: "teal" },
  { value: "visita_realizada", label: "Visita realizada", tone: "teal" },
  { value: "dimensionamento", label: "Dimensionamento", tone: "amber" },
  { value: "orcamento", label: "Orçamento", tone: "amber" },
  { value: "negociacao", label: "Negociação", tone: "amber" },
  { value: "aprovacao", label: "Aprovação", tone: "green" },
  { value: "contrato", label: "Contrato", tone: "green" },
  { value: "pagamento", label: "Pagamento", tone: "green" },
  { value: "instalacao", label: "Instalação", tone: "green" },
  { value: "pos_venda", label: "Pós-venda", tone: "green" },
  { value: "perdido", label: "Perdido", tone: "red" },
];

export const FUNIL_STAGE_LABEL: Record<LeadStatus, string> = Object.fromEntries(
  FUNIL_STAGES.map((s) => [s.value, s.label])
) as Record<LeadStatus, string>;

export const FUNIL_STAGE_TONE: Record<LeadStatus, BadgeTone> = Object.fromEntries(
  FUNIL_STAGES.map((s) => [s.value, s.tone])
) as Record<LeadStatus, BadgeTone>;

export const TEMPERATURA_OPTIONS: { value: string; label: string; tone: BadgeTone }[] = [
  { value: "frio", label: "Frio", tone: "blue" },
  { value: "morno", label: "Morno", tone: "amber" },
  { value: "quente", label: "Quente", tone: "red" },
];
