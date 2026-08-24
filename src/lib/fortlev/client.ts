/**
 * Cliente para a API oficial de parceiros da Fortlev Solar
 * (https://fortlevsolar.app/api). Só roda no servidor — nunca importar isso
 * em um componente "use client".
 *
 * Endpoints confirmados a partir do SDK Python oficial (fortlev_solar_sdk,
 * mantido por alguém da própria Fortlev Solar):
 *   POST /user/login              → autentica (usuário/senha), devolve token
 *   GET  /{scope}/component/all   → catálogo de componentes (sem preço unitário)
 *   GET  /{scope}/surface/        → tipos de superfície de instalação
 *   GET  /{scope}/brazilian-city/ → cidades atendidas
 *   POST /{scope}/order/          → cota kits fotovoltaicos completos (com preço)
 *
 * A Fortlev não vende "item avulso com preço fixo" — o preço só existe no
 * contexto de um kit completo, cotado sob demanda para uma potência/cidade/etc.
 */

const BASE_URL = "https://fortlevsolar.app/api";

export class FortlevApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FortlevApiError";
  }
}

export type FortlevAuth = {
  accessToken: string;
  scope: string;
  tokenType: string;
};

export type FortlevComponent = {
  id: string;
  name: string;
  family: string | null;
  code: string | null;
  attachments: { key: string; path: string }[];
};

export type FortlevKitQuoteParams = {
  power?: number;
  voltage?: "220" | "380" | "+";
  phase?: 1 | 2 | 3;
  surface?: string;
  city?: string;
};

export type FortlevPvKit = {
  final_price: number;
  full_price: number;
  discount: number;
  power: number;
  voltage: string;
  phase: number;
  pv_kit_components: { component: FortlevComponent; quantity: number }[];
  display_images: { key: string; path: string }[];
};

export type FortlevOrder = {
  final_price: number;
  full_price: number;
  discount: number;
  power: number;
  delivery_at: string | null;
  pv_kits: FortlevPvKit[];
};

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.detail ?? `Erro HTTP ${res.status}`;
  } catch {
    return `Erro HTTP ${res.status}`;
  }
}

/** Autentica no portal de parceiros. Lança FortlevApiError se as credenciais forem inválidas. */
export async function fortlevAuthenticate(username: string, password: string): Promise<FortlevAuth> {
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) {
    throw new FortlevApiError(res.status, await parseErrorBody(res));
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    scope: data.scope,
    tokenType: data.token_type ?? "Bearer",
  };
}

/** Busca o catálogo completo de componentes (módulos, inversores, estruturas...). */
export async function fortlevComponents(auth: FortlevAuth): Promise<FortlevComponent[]> {
  const res = await fetch(`${BASE_URL}/${auth.scope}/component/all`, {
    headers: { Authorization: `${auth.tokenType} ${auth.accessToken}` },
  });
  if (!res.ok) {
    throw new FortlevApiError(res.status, await parseErrorBody(res));
  }
  const data = await res.json();
  const docs: Record<string, unknown>[] = data.docs ?? [];
  return docs.map((d) => ({
    id: String(d.id),
    name: String(d.name ?? ""),
    family: (d.family as string) ?? null,
    code: (d.code as string) ?? null,
    attachments: Array.isArray(d.attachments)
      ? (d.attachments as { key: string; path: string }[])
      : [],
  }));
}

/**
 * Cota kits fotovoltaicos completos prontos para uma potência/cidade/etc.
 * Use isso no Simulador/Orçamento para trazer preço real da Fortlev.
 * Dica da própria Fortlev: power=0 devolve o catálogo geral de kits disponíveis.
 */
export async function fortlevOrders(
  auth: FortlevAuth,
  params: FortlevKitQuoteParams
): Promise<FortlevOrder[]> {
  const res = await fetch(`${BASE_URL}/${auth.scope}/order/`, {
    method: "POST",
    headers: {
      Authorization: `${auth.tokenType} ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_power: params.power ?? 0,
      voltage: params.voltage ?? "220",
      phase: params.phase ?? 1,
      surface: params.surface ?? null,
      brazilian_city: params.city ?? null,
    }),
  });
  if (!res.ok) {
    throw new FortlevApiError(res.status, await parseErrorBody(res));
  }
  return res.json();
}

/** Lê as credenciais das variáveis de ambiente do servidor (nunca do banco). */
export function getFortlevCredentials(): { username: string; password: string } | null {
  const username = process.env.FORTLEV_SOLAR_USERNAME;
  const password = process.env.FORTLEV_SOLAR_PWD;
  if (!username || !password) return null;
  return { username, password };
}
