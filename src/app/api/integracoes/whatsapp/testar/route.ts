import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GRAPH_VERSION = "v21.0";

/**
 * Testa a conexão com o WhatsApp Business API (Cloud API) usando as
 * variáveis de ambiente do servidor. Nunca envia mensagem nenhuma — só lê
 * os dados básicos do número configurado, para confirmar que o token e o
 * phone_number_id são válidos. Se as variáveis não existirem, responde de
 * forma honesta que a integração não está configurada.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        { provider: "whatsapp", status: "nao_configurado", ultimo_erro: null, ultima_verificacao: new Date().toISOString() },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({
      configured: false,
      config,
      error:
        "WhatsApp Business API não configurado. Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID nas variáveis de ambiente da Vercel.",
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (!res.ok) {
      const mensagem = data?.error?.message ?? `Erro HTTP ${res.status}`;
      const { data: config } = await supabase
        .from("integration_configs")
        .upsert(
          { provider: "whatsapp", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
          { onConflict: "owner_id,provider" }
        )
        .select()
        .single();
      return NextResponse.json({ configured: true, config, error: mensagem }, { status: 502 });
    }

    const metadata = {
      display_phone_number: data.display_phone_number ?? null,
      verified_name: data.verified_name ?? null,
      quality_rating: data.quality_rating ?? null,
    };
    const { data: config } = await supabase
      .from("integration_configs")
      .upsert(
        {
          provider: "whatsapp",
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
        { provider: "whatsapp", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
        { onConflict: "owner_id,provider" }
      )
      .select()
      .single();
    return NextResponse.json({ configured: true, config, error: mensagem }, { status: 502 });
  }
}
