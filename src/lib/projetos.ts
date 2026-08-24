import type { HomologacaoStatus, InstalacaoStatus, ProjectStatus } from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const PROJECT_STAGES: { value: ProjectStatus; label: string; tone: BadgeTone }[] = [
  { value: "venda", label: "Venda", tone: "blue" },
  { value: "documentacao", label: "Documentação", tone: "blue" },
  { value: "dimensionamento", label: "Dimensionamento", tone: "teal" },
  { value: "homologacao", label: "Homologação", tone: "amber" },
  { value: "compra", label: "Compra", tone: "amber" },
  { value: "separacao", label: "Separação", tone: "amber" },
  { value: "instalacao", label: "Instalação", tone: "teal" },
  { value: "vistoria", label: "Vistoria", tone: "teal" },
  { value: "ativacao", label: "Ativação", tone: "green" },
  { value: "entrega", label: "Entrega", tone: "green" },
  { value: "pos_venda", label: "Pós-venda", tone: "green" },
];

export const PROJECT_STAGE_LABEL: Record<ProjectStatus, string> = Object.fromEntries(
  PROJECT_STAGES.map((s) => [s.value, s.label])
) as Record<ProjectStatus, string>;

export const PROJECT_STAGE_TONE: Record<ProjectStatus, BadgeTone> = Object.fromEntries(
  PROJECT_STAGES.map((s) => [s.value, s.tone])
) as Record<ProjectStatus, BadgeTone>;

export const HOMOLOGACAO_STATUS: { value: HomologacaoStatus; label: string; tone: BadgeTone }[] = [
  { value: "pendente", label: "Pendente", tone: "neutral" },
  { value: "documentacao", label: "Documentação", tone: "blue" },
  { value: "enviado", label: "Enviado", tone: "blue" },
  { value: "em_analise", label: "Em análise", tone: "amber" },
  { value: "pendencia", label: "Pendência", tone: "red" },
  { value: "aprovado", label: "Aprovado", tone: "green" },
  { value: "rejeitado", label: "Rejeitado", tone: "red" },
];

export const HOMOLOGACAO_LABEL: Record<HomologacaoStatus, string> = Object.fromEntries(
  HOMOLOGACAO_STATUS.map((s) => [s.value, s.label])
) as Record<HomologacaoStatus, string>;

export const HOMOLOGACAO_TONE: Record<HomologacaoStatus, BadgeTone> = Object.fromEntries(
  HOMOLOGACAO_STATUS.map((s) => [s.value, s.tone])
) as Record<HomologacaoStatus, BadgeTone>;

export const INSTALACAO_STATUS: { value: InstalacaoStatus; label: string; tone: BadgeTone }[] = [
  { value: "agendada", label: "Agendada", tone: "blue" },
  { value: "confirmada", label: "Confirmada", tone: "teal" },
  { value: "em_andamento", label: "Em andamento", tone: "amber" },
  { value: "concluida", label: "Concluída", tone: "green" },
  { value: "pendente", label: "Pendente", tone: "neutral" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export const INSTALACAO_LABEL: Record<InstalacaoStatus, string> = Object.fromEntries(
  INSTALACAO_STATUS.map((s) => [s.value, s.label])
) as Record<InstalacaoStatus, string>;

export const INSTALACAO_TONE: Record<InstalacaoStatus, BadgeTone> = Object.fromEntries(
  INSTALACAO_STATUS.map((s) => [s.value, s.tone])
) as Record<InstalacaoStatus, BadgeTone>;

export const DEFAULT_PROJECT_CHECKLIST = [
  "Contrato assinado",
  "Documentação do cliente recebida",
  "Projeto técnico elaborado",
  "Homologação protocolada",
  "Equipamentos comprados",
  "Instalação concluída",
  "Vistoria da concessionária aprovada",
  "Sistema ativado",
];

export const DEFAULT_INSTALACAO_CHECKLIST = [
  "Equipamentos conferidos e carregados",
  "EPIs da equipe verificados",
  "Estrutura fixada",
  "Módulos instalados",
  "Inversor instalado e conectado",
  "Aterramento e proteções conferidos",
  "Sistema testado e gerando",
  "Cliente orientado sobre o monitoramento",
];

/** true quando a homologação está sem resposta há mais tempo que o prazo esperado. */
export function isHomologacaoAtrasada(dataEnvio: string | null, prazoDias: number | null, status: HomologacaoStatus) {
  if (!dataEnvio || status === "aprovado" || status === "rejeitado") return false;
  const prazo = prazoDias ?? 45;
  const limite = new Date(dataEnvio);
  limite.setDate(limite.getDate() + prazo);
  return limite.getTime() < Date.now();
}
