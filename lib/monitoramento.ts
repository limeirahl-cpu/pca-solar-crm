import type {
  CheckinEtapa,
  CheckinStatus,
  MonitoringConfigStatus,
  MonitoringProvider,
  PlantAlertSeveridade,
  PlantAlertStatus,
  PlantAlertTipo,
} from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const ALERT_TIPO: { value: PlantAlertTipo; label: string }[] = [
  { value: "geracao_baixa", label: "Geração abaixo do esperado" },
  { value: "sem_dados", label: "Sem dados de geração recentes" },
  { value: "offline", label: "Usina offline" },
  { value: "manual", label: "Alerta manual" },
];

export const ALERT_TIPO_LABEL: Record<PlantAlertTipo, string> = Object.fromEntries(
  ALERT_TIPO.map((t) => [t.value, t.label])
) as Record<PlantAlertTipo, string>;

export const ALERT_SEVERIDADE: { value: PlantAlertSeveridade; label: string; tone: BadgeTone }[] = [
  { value: "baixa", label: "Baixa", tone: "neutral" },
  { value: "media", label: "Média", tone: "amber" },
  { value: "alta", label: "Alta", tone: "red" },
];

export const ALERT_SEVERIDADE_LABEL: Record<PlantAlertSeveridade, string> = Object.fromEntries(
  ALERT_SEVERIDADE.map((s) => [s.value, s.label])
) as Record<PlantAlertSeveridade, string>;

export const ALERT_SEVERIDADE_TONE: Record<PlantAlertSeveridade, BadgeTone> = Object.fromEntries(
  ALERT_SEVERIDADE.map((s) => [s.value, s.tone])
) as Record<PlantAlertSeveridade, BadgeTone>;

export const ALERT_STATUS_LABEL: Record<PlantAlertStatus, string> = {
  aberto: "Aberto",
  resolvido: "Resolvido",
};

export const ALERT_STATUS_TONE: Record<PlantAlertStatus, BadgeTone> = {
  aberto: "red",
  resolvido: "green",
};

export const MONITORING_PROVIDER: { value: MonitoringProvider; label: string; disponivel: boolean }[] = [
  { value: "manual", label: "Registro manual (padrão)", disponivel: true },
  { value: "growatt", label: "Growatt", disponivel: false },
  { value: "fronius", label: "Fronius", disponivel: false },
  { value: "deye", label: "Deye", disponivel: false },
  { value: "solaredge", label: "SolarEdge", disponivel: false },
  { value: "huawei", label: "Huawei", disponivel: false },
  { value: "outro", label: "Outro provedor", disponivel: false },
];

export const MONITORING_STATUS_LABEL: Record<MonitoringConfigStatus, string> = {
  manual: "Manual (ativo)",
  nao_configurado: "Não configurado",
  conectado: "Conectado",
  erro: "Erro de conexão",
};

export const MONITORING_STATUS_TONE: Record<MonitoringConfigStatus, BadgeTone> = {
  manual: "blue",
  nao_configurado: "neutral",
  conectado: "green",
  erro: "red",
};

export const CHECKIN_ETAPA_LABEL: Record<CheckinEtapa, string> = {
  d1: "D+1",
  d7: "D+7",
  d30: "D+30",
  d90: "D+90",
  d180: "D+180",
  d365: "D+365",
};

export const CHECKIN_STATUS: { value: CheckinStatus; label: string; tone: BadgeTone }[] = [
  { value: "pendente", label: "Pendente", tone: "neutral" },
  { value: "realizado", label: "Realizado", tone: "green" },
  { value: "nao_respondeu", label: "Cliente não respondeu", tone: "amber" },
  { value: "nao_aplicavel", label: "Não aplicável", tone: "neutral" },
];

export const CHECKIN_STATUS_LABEL: Record<CheckinStatus, string> = Object.fromEntries(
  CHECKIN_STATUS.map((s) => [s.value, s.label])
) as Record<CheckinStatus, string>;

export const CHECKIN_STATUS_TONE: Record<CheckinStatus, BadgeTone> = Object.fromEntries(
  CHECKIN_STATUS.map((s) => [s.value, s.tone])
) as Record<CheckinStatus, BadgeTone>;

/** true quando o checkin está pendente e a data prevista já passou. */
export function isCheckinAtrasado(dataPrevista: string, status: CheckinStatus) {
  if (status !== "pendente") return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(dataPrevista) < hoje;
}

/** Dias sem nenhum registro de geração a partir dos quais consideramos a usina "sem dados". */
export const DIAS_SEM_DADOS_LIMITE = 10;

/** Percentual mínimo da geração diária média esperada abaixo do qual soa o alerta de "geração baixa". */
export const PERCENTUAL_GERACAO_BAIXA = 0.5;
