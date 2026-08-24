import type { OrdemServicoPrioridade, OrdemServicoStatus, OrdemServicoTipo } from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const ORDEM_TIPO: { value: OrdemServicoTipo; label: string; tone: BadgeTone }[] = [
  { value: "manutencao", label: "Manutenção", tone: "amber" },
  { value: "limpeza", label: "Limpeza", tone: "teal" },
  { value: "garantia", label: "Garantia", tone: "blue" },
  { value: "ampliacao", label: "Ampliação", tone: "green" },
  { value: "vistoria", label: "Vistoria", tone: "neutral" },
  { value: "outro", label: "Outro", tone: "neutral" },
];

export const ORDEM_TIPO_LABEL: Record<OrdemServicoTipo, string> = Object.fromEntries(
  ORDEM_TIPO.map((t) => [t.value, t.label])
) as Record<OrdemServicoTipo, string>;

export const ORDEM_TIPO_TONE: Record<OrdemServicoTipo, BadgeTone> = Object.fromEntries(
  ORDEM_TIPO.map((t) => [t.value, t.tone])
) as Record<OrdemServicoTipo, BadgeTone>;

export const ORDEM_STATUS: { value: OrdemServicoStatus; label: string; tone: BadgeTone }[] = [
  { value: "aberta", label: "Aberta", tone: "neutral" },
  { value: "agendada", label: "Agendada", tone: "blue" },
  { value: "em_andamento", label: "Em andamento", tone: "amber" },
  { value: "concluida", label: "Concluída", tone: "green" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export const ORDEM_STATUS_LABEL: Record<OrdemServicoStatus, string> = Object.fromEntries(
  ORDEM_STATUS.map((s) => [s.value, s.label])
) as Record<OrdemServicoStatus, string>;

export const ORDEM_STATUS_TONE: Record<OrdemServicoStatus, BadgeTone> = Object.fromEntries(
  ORDEM_STATUS.map((s) => [s.value, s.tone])
) as Record<OrdemServicoStatus, BadgeTone>;

export const ORDEM_PRIORIDADE: { value: OrdemServicoPrioridade; label: string; tone: BadgeTone }[] = [
  { value: "baixa", label: "Baixa", tone: "neutral" },
  { value: "media", label: "Média", tone: "blue" },
  { value: "alta", label: "Alta", tone: "amber" },
  { value: "urgente", label: "Urgente", tone: "red" },
];

export const ORDEM_PRIORIDADE_LABEL: Record<OrdemServicoPrioridade, string> = Object.fromEntries(
  ORDEM_PRIORIDADE.map((p) => [p.value, p.label])
) as Record<OrdemServicoPrioridade, string>;

export const ORDEM_PRIORIDADE_TONE: Record<OrdemServicoPrioridade, BadgeTone> = Object.fromEntries(
  ORDEM_PRIORIDADE.map((p) => [p.value, p.tone])
) as Record<OrdemServicoPrioridade, BadgeTone>;

/** Checklist inicial sugerido por tipo de O.S. — ponto de partida editável, não obrigatório. */
export const DEFAULT_ORDEM_CHECKLIST: Record<OrdemServicoTipo, string[]> = {
  manutencao: [
    "Diagnóstico do problema realizado",
    "Peças/equipamentos necessários identificados",
    "Reparo executado",
    "Sistema testado após o reparo",
  ],
  limpeza: [
    "Módulos limpos",
    "Estrutura e cabos inspecionados",
    "Geração conferida após limpeza",
  ],
  garantia: [
    "Defeito registrado com fotos",
    "Fabricante/fornecedor acionado",
    "Peça substituída ou reparo coberto",
    "Cliente comunicado da resolução",
  ],
  ampliacao: [
    "Levantamento da capacidade atual",
    "Novo dimensionamento definido",
    "Orçamento da ampliação aprovado",
    "Homologação da ampliação protocolada",
    "Novos módulos/inversor instalados",
  ],
  vistoria: [
    "Sistema inspecionado visualmente",
    "Geração comparada com o esperado",
    "Relatório de vistoria entregue ao cliente",
  ],
  outro: [],
};
