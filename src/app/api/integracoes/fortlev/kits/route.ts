import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fortlevAuthenticate, fortlevOrders, getFortlevCredentials, FortlevApiError } from "@/lib/fortlev/client";

export const runtime = "nodejs";

/**
 * Cota kits fotovoltaicos completos da Fortlev Solar em tempo real, para uma
 * potência/cidade/etc. A Fortlev não tem "preço de item avulso" — o preço só
 * existe no contexto de um kit pronto, por isso essa rota não salva nada no
 * banco, sempre busca ao vivo. Pensada para ser chamada a partir do
 * Simulador Solar / tela de Orçamentos.
 *
 * Body esperado: { power?: number, voltage?: "220"|"380"|"+", phase?: 1|2|3,
 *                   surface?: string, city?: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const credentials = getFortlevCredentials();
  if (!credentials) {
    return NextResponse.json(
      {
        error:
          "Fortlev Solar não configurado. Defina FORTLEV_SOLAR_USERNAME e FORTLEV_SOLAR_PWD nas variáveis de ambiente da Vercel.",
      },
      { status: 400 }
    );
  }

  const params = await request.json().catch(() => ({}));

  try {
    const auth = await fortlevAuthenticate(credentials.username, credentials.password);
    const orders = await fortlevOrders(auth, params);
    return NextResponse.json({ orders });
  } catch (err) {
    const mensagem =
      err instanceof FortlevApiError ? err.message : "Falha ao buscar kits da Fortlev Solar.";
    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}
