import type { IntegrationProvider, IntegrationStatus } from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const INTEGRATION_PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  whatsapp: "WhatsApp Business API",
  instagram: "Instagram Graph API",
};

export const INTEGRATION_STATUS_LABEL: Record<IntegrationStatus, string> = {
  nao_configurado: "Não configurado",
  conectado: "Conectado",
  erro: "Erro de conexão",
};

export const INTEGRATION_STATUS_TONE: Record<IntegrationStatus, BadgeTone> = {
  nao_configurado: "neutral",
  conectado: "green",
  erro: "red",
};

export const INTEGRATION_ENV_VARS: Record<IntegrationProvider, string[]> = {
  whatsapp: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
  instagram: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"],
};
