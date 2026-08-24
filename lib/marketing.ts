import type {
  MarketingCampaignCanal,
  MarketingCampaignStatus,
  MarketingPostCanal,
  MarketingPostStatus,
} from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const CAMPAIGN_CANAL: { value: MarketingCampaignCanal; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google Ads" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
];

export const CAMPAIGN_CANAL_LABEL: Record<MarketingCampaignCanal, string> = Object.fromEntries(
  CAMPAIGN_CANAL.map((c) => [c.value, c.label])
) as Record<MarketingCampaignCanal, string>;

export const CAMPAIGN_STATUS: { value: MarketingCampaignStatus; label: string; tone: BadgeTone }[] = [
  { value: "planejada", label: "Planejada", tone: "neutral" },
  { value: "ativa", label: "Ativa", tone: "green" },
  { value: "pausada", label: "Pausada", tone: "amber" },
  { value: "encerrada", label: "Encerrada", tone: "neutral" },
];

export const CAMPAIGN_STATUS_LABEL: Record<MarketingCampaignStatus, string> = Object.fromEntries(
  CAMPAIGN_STATUS.map((s) => [s.value, s.label])
) as Record<MarketingCampaignStatus, string>;

export const CAMPAIGN_STATUS_TONE: Record<MarketingCampaignStatus, BadgeTone> = Object.fromEntries(
  CAMPAIGN_STATUS.map((s) => [s.value, s.tone])
) as Record<MarketingCampaignStatus, BadgeTone>;

export const POST_CANAL: { value: MarketingPostCanal; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "blog", label: "Blog" },
  { value: "outro", label: "Outro" },
];

export const POST_CANAL_LABEL: Record<MarketingPostCanal, string> = Object.fromEntries(
  POST_CANAL.map((c) => [c.value, c.label])
) as Record<MarketingPostCanal, string>;

export const POST_STATUS: { value: MarketingPostStatus; label: string; tone: BadgeTone }[] = [
  { value: "ideia", label: "Ideia", tone: "neutral" },
  { value: "rascunho", label: "Rascunho", tone: "blue" },
  { value: "aguardando_aprovacao", label: "Aguardando aprovação", tone: "amber" },
  { value: "aprovado", label: "Aprovado", tone: "teal" },
  { value: "publicado", label: "Publicado", tone: "green" },
  { value: "cancelado", label: "Cancelado", tone: "red" },
];

export const POST_STATUS_LABEL: Record<MarketingPostStatus, string> = Object.fromEntries(
  POST_STATUS.map((s) => [s.value, s.label])
) as Record<MarketingPostStatus, string>;

export const POST_STATUS_TONE: Record<MarketingPostStatus, BadgeTone> = Object.fromEntries(
  POST_STATUS.map((s) => [s.value, s.tone])
) as Record<MarketingPostStatus, BadgeTone>;

/** Status considerados "banco de criativos" — ainda não agendados/aprovados. */
export const CRIATIVO_STATUS: MarketingPostStatus[] = ["ideia", "rascunho"];
