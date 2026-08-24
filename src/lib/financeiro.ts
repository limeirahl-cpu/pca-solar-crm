import type { FinancialCategoriaTipo, FinancialEntryStatus } from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const FINANCIAL_STATUS: { value: FinancialEntryStatus; label: string; tone: BadgeTone }[] = [
  { value: "pendente", label: "Pendente", tone: "neutral" },
  { value: "pago", label: "Pago", tone: "green" },
  { value: "cancelado", label: "Cancelado", tone: "red" },
];

export const FINANCIAL_STATUS_LABEL: Record<FinancialEntryStatus, string> = Object.fromEntries(
  FINANCIAL_STATUS.map((s) => [s.value, s.label])
) as Record<FinancialEntryStatus, string>;

export const FINANCIAL_STATUS_TONE: Record<FinancialEntryStatus, BadgeTone> = Object.fromEntries(
  FINANCIAL_STATUS.map((s) => [s.value, s.tone])
) as Record<FinancialEntryStatus, BadgeTone>;

export const FINANCIAL_TIPO_LABEL: Record<FinancialCategoriaTipo, string> = {
  receita: "Receita",
  despesa: "Despesa",
};

/** true quando o lançamento está pendente e a data de vencimento já passou. */
export function isVencido(dataVencimento: string, status: FinancialEntryStatus) {
  if (status !== "pendente") return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(dataVencimento) < hoje;
}
