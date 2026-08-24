/**
 * Simulador de dimensionamento solar.
 *
 * As médias de HSP (horas de sol pleno) por estado são uma estimativa
 * regional para pré-dimensionamento comercial — não substituem um estudo
 * de irradiação no local exato da instalação. Deixe isso claro para o
 * cliente na proposta final.
 */
export const HSP_POR_ESTADO: Record<string, number> = {
  AC: 4.5, AL: 5.5, AP: 4.8, AM: 4.4, BA: 5.5, CE: 5.6, DF: 5.3, ES: 5.0,
  GO: 5.3, MA: 5.2, MT: 5.1, MS: 5.2, MG: 5.3, PA: 4.7, PB: 5.6, PR: 4.6,
  PE: 5.6, PI: 5.6, RJ: 4.9, RN: 5.7, RS: 4.7, RO: 4.6, RR: 4.6, SC: 4.5,
  SP: 4.9, SE: 5.5, TO: 5.2,
};

/** Performance ratio típico (perdas de temperatura, fiação, sujeira, inversor). */
export const PERFORMANCE_RATIO = 0.78;

/** Área ocupada por módulo moderno de alta potência (m², aproximado). */
export const AREA_POR_MODULO_M2 = 2.6;

export const POTENCIAS_MODULO_WP = [450, 550, 610, 700];

/** Catálogo de referência de inversores por potência (kW) — sem integração com estoque ainda. */
export const CATALOGO_INVERSORES_KW = [3, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100];

export type SimuladorInput = {
  consumoKwhMes: number;
  valorConta: number;
  estado: string;
  potenciaModuloWp: number;
};

export type SimuladorResultado = {
  hsp: number;
  tarifaKwh: number;
  potenciaNecessariaKwp: number;
  quantidadeModulos: number;
  potenciaRealKwp: number;
  inversorSugeridoKw: number;
  geracaoEstimadaMensalKwh: number;
  economiaEstimadaMensal: number;
  economiaEstimadaAnual: number;
  areaOcupadaM2: number;
};

export function simular(input: SimuladorInput): SimuladorResultado | null {
  const { consumoKwhMes, valorConta, estado, potenciaModuloWp } = input;
  if (!consumoKwhMes || consumoKwhMes <= 0 || !potenciaModuloWp) return null;

  const hsp = HSP_POR_ESTADO[estado] ?? 5.0;
  const tarifaKwh = valorConta > 0 ? valorConta / consumoKwhMes : 0;

  const potenciaNecessariaKwp = consumoKwhMes / (hsp * 30 * PERFORMANCE_RATIO);
  const quantidadeModulos = Math.max(1, Math.ceil((potenciaNecessariaKwp * 1000) / potenciaModuloWp));
  const potenciaRealKwp = (quantidadeModulos * potenciaModuloWp) / 1000;

  const inversorSugeridoKw =
    CATALOGO_INVERSORES_KW.find((kw) => kw >= potenciaRealKwp) ??
    CATALOGO_INVERSORES_KW[CATALOGO_INVERSORES_KW.length - 1];

  const geracaoEstimadaMensalKwh = potenciaRealKwp * hsp * 30 * PERFORMANCE_RATIO;
  const economiaEstimadaMensal = geracaoEstimadaMensalKwh * tarifaKwh;
  const economiaEstimadaAnual = economiaEstimadaMensal * 12;
  const areaOcupadaM2 = quantidadeModulos * AREA_POR_MODULO_M2;

  return {
    hsp,
    tarifaKwh,
    potenciaNecessariaKwp,
    quantidadeModulos,
    potenciaRealKwp,
    inversorSugeridoKw,
    geracaoEstimadaMensalKwh,
    economiaEstimadaMensal,
    economiaEstimadaAnual,
    areaOcupadaM2,
  };
}

export const ESTADOS_BR = Object.keys(HSP_POR_ESTADO).sort();
