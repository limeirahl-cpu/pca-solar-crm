import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GRAPH_VERSION = "v21.0";

/**
 * Testa a conexão com a Instagram Graph API (conta business/creator conectada
 * via Meta Business Suite) usando as variáveis de ambiente do servidor. Só lê
 * dados básicos da própria conta — nunca publica nada. Se as variáveis não
 * existirem, responde de forma honesta que a integração não está configurada.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !businessAccountId) {
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        { provider: "instagram", status: "nao_configurado", ultimo_erro: null, ultima_verificacao: new Date().toISOString() },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({
      configured: false,
      config,
      error:
        "Instagram Graph API não configurada. Defina INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID nas variáveis de ambiente da Vercel.",
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${businessAccountId}?fields=username,name,followers_count`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (!res.ok) {
      const mensagem = data?.error?.message ?? `Erro HTTP ${res.status}`;
      const { data: config } = await supabase
        .from("integration_configs")
        .upsert(
          { provider: "instagram", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
          { onConflict: "owner_id,provider" }
        )
        .select()
        .single();
      return NextResponse.json({ configured: true, config, error: mensagem }, { status: 502 });
    }

    const metadata = {
      username: data.username ?? null,
      name: data.name ?? null,
      followers_count: data.followers_count ?? null,
    };
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        {
          provider: "instagram",
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
  } catch {
    const mensagem = "Falha de conexão com a API da Meta.";
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        { provider: "instagram", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({ configured: true, config, error: mensagem }, { status: 502 });
  }
}
