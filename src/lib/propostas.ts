import type { ProposalStatus } from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const PROPOSAL_STATUS_TONE: Record<ProposalStatus, BadgeTone> = {
  rascunho: "neutral",
  enviado: "blue",
  aprovado: "green",
  recusado: "red",
};
