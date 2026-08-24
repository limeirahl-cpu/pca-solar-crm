import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fortlevAuthenticate, getFortlevCredentials, FortlevApiError } from "@/lib/fortlev/client";

export const runtime = "nodejs";

/**
 * Testa a conexão com a API de parceiros da Fortlev Solar usando as
 * variáveis de ambiente do servidor. Não sincroniza nada — só confirma que
 * usuário/senha são válidos. Se as variáveis não existirem, responde de
 * forma honesta que a integração não está configurada (mesmo padrão do
 * WhatsApp/Instagram).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const credentials = getFortlevCredentials();

  if (!credentials) {
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        {
          provider: "fortlev",
          status: "nao_configurado",
          ultimo_erro: null,
          ultima_verificacao: new Date().toISOString(),
        },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({
      configured: false,
      config,
      error:
        "Fortlev Solar não configurado. Defina FORTLEV_SOLAR_USERNAME e FORTLEV_SOLAR_PWD nas variáveis de ambiente da Vercel (mesmo usuário/senha do portal de parceiros da Fortlev).",
    });
  }

  try {
    const auth = await fortlevAuthenticate(credentials.username, credentials.password);
    const metadata = { scope: auth.scope };
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        {
          provider: "fortlev",
          status: "conectado",
          metadata,
          ultimo_erro: null,
          ultima_verificacao: new Date().toISOString(),
        },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({ configured: true, config });
  } catch (err) {
    const mensagem =
      err instanceof FortlevApiError ? err.message : "Falha de conexão com a API da Fortlev Solar.";
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        { provider: "fortlev", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({ configured: true, config, error: mensagem }, { status: 502 });
  }
}
