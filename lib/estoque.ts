import type {
  ProductCategoria,
  PurchaseStatus,
  StockMovementMotivo,
  StockMovementTipo,
  StockReservationStatus,
} from "@/lib/database.types";
import type { BadgeTone } from "@/lib/funil";

export const PRODUCT_CATEGORIA: { value: ProductCategoria; label: string }[] = [
  { value: "modulo", label: "Módulo fotovoltaico" },
  { value: "inversor", label: "Inversor" },
  { value: "estrutura", label: "Estrutura de fixação" },
  { value: "cabo", label: "Cabo" },
  { value: "conector", label: "Conector" },
  { value: "protecao", label: "Proteção/String box" },
  { value: "outro", label: "Outro" },
];

export const PRODUCT_CATEGORIA_LABEL: Record<ProductCategoria, string> = Object.fromEntries(
  PRODUCT_CATEGORIA.map((c) => [c.value, c.label])
) as Record<ProductCategoria, string>;

/** Categorias tratadas como "equipamento principal" na tela de Equipamentos. */
export const EQUIPAMENTO_CATEGORIAS: ProductCategoria[] = ["modulo", "inversor", "estrutura"];

export const PURCHASE_STATUS: { value: PurchaseStatus; label: string; tone: BadgeTone }[] = [
  { value: "rascunho", label: "Rascunho", tone: "neutral" },
  { value: "enviado", label: "Enviado ao fornecedor", tone: "blue" },
  { value: "aprovado", label: "Aprovado", tone: "teal" },
  { value: "recebido", label: "Recebido", tone: "green" },
  { value: "cancelado", label: "Cancelado", tone: "red" },
];

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = Object.fromEntries(
  PURCHASE_STATUS.map((s) => [s.value, s.label])
) as Record<PurchaseStatus, string>;

export const PURCHASE_STATUS_TONE: Record<PurchaseStatus, BadgeTone> = Object.fromEntries(
  PURCHASE_STATUS.map((s) => [s.value, s.tone])
) as Record<PurchaseStatus, BadgeTone>;

export const STOCK_MOVEMENT_TIPO: { value: StockMovementTipo; label: string; tone: BadgeTone }[] = [
  { value: "entrada", label: "Entrada", tone: "green" },
  { value: "saida", label: "Saída", tone: "amber" },
  { value: "ajuste", label: "Ajuste", tone: "blue" },
];

export const STOCK_MOVEMENT_TIPO_LABEL: Record<StockMovementTipo, string> = Object.fromEntries(
  STOCK_MOVEMENT_TIPO.map((t) => [t.value, t.label])
) as Record<StockMovementTipo, string>;

export const STOCK_MOVEMENT_TIPO_TONE: Record<StockMovementTipo, BadgeTone> = Object.fromEntries(
  STOCK_MOVEMENT_TIPO.map((t) => [t.value, t.tone])
) as Record<StockMovementTipo, BadgeTone>;

export const STOCK_MOVEMENT_MOTIVO: { value: StockMovementMotivo; label: string }[] = [
  { value: "compra", label: "Compra recebida" },
  { value: "instalacao", label: "Uso em instalação" },
  { value: "devolucao", label: "Devolução" },
  { value: "perda", label: "Perda/avaria" },
  { value: "ajuste_inventario", label: "Ajuste de inventário" },
  { value: "outro", label: "Outro" },
];

export const STOCK_MOVEMENT_MOTIVO_LABEL: Record<StockMovementMotivo, string> = Object.fromEntries(
  STOCK_MOVEMENT_MOTIVO.map((m) => [m.value, m.label])
) as Record<StockMovementMotivo, string>;

export const STOCK_RESERVATION_STATUS: { value: StockReservationStatus; label: string; tone: BadgeTone }[] = [
  { value: "reservada", label: "Reservada", tone: "blue" },
  { value: "consumida", label: "Consumida", tone: "green" },
  { value: "cancelada", label: "Cancelada", tone: "red" },
];

export const STOCK_RESERVATION_STATUS_LABEL: Record<StockReservationStatus, string> = Object.fromEntries(
  STOCK_RESERVATION_STATUS.map((s) => [s.value, s.label])
) as Record<StockReservationStatus, string>;

export const STOCK_RESERVATION_STATUS_TONE: Record<StockReservationStatus, BadgeTone> = Object.fromEntries(
  STOCK_RESERVATION_STATUS.map((s) => [s.value, s.tone])
) as Record<StockReservationStatus, BadgeTone>;

/** true quando o estoque atual está no ou abaixo do mínimo definido para o produto. */
export function isEstoqueBaixo(estoqueAtual: number, estoqueMinimo: number) {
  return estoqueMinimo > 0 && estoqueAtual <= estoqueMinimo;
}
