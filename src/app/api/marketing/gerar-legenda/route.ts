import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";

const ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

/**
 * Geração assistida por IA de legendas para posts de marketing.
 *
 * Requer autenticação (mesma sessão do CRM) e a variável de ambiente
 * ANTHROPIC_API_KEY configurada no servidor (Vercel). Se a chave não estiver
 * configurada, retorna 503 de forma explícita — a interface deve mostrar
 * "IA não configurada", nunca fingir um resultado.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Geração por IA não configurada. Adicione a variável de ambiente ANTHROPIC_API_KEY nas configurações do projeto na Vercel para ativar este recurso.",
      },
      { status: 503 }
    );
  }

  let body: { tema?: string; canal?: string; tom?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const tema = (body.tema ?? "").trim();
  if (!tema) {
    return NextResponse.json({ error: "Informe o tema ou assunto do post." }, { status: 400 });
  }
  const canal = body.canal ?? "instagram";
  const tom = body.tom ?? "próximo e confiável, sem exagero";

  const prompt = `Você é responsável pelo marketing de conteúdo da ${COMPANY.legalName} (${COMPANY.name}), empresa de ${COMPANY.segment}, localizada em ${COMPANY.address}. Tagline da marca: "${COMPANY.tagline}".

Escreva uma legenda para uma publicação de ${canal} sobre o seguinte tema: "${tema}".

Tom desejado: ${tom}.

Regras:
- Português do Brasil, natural, sem parecer robótico.
- Até 5 frases curtas.
- Termine com uma chamada para ação simples (ex: chamar no WhatsApp, pedir orçamento).
- Sugira de 3 a 6 hashtags relevantes ao final, em uma linha separada.
- Não invente números, prêmios ou dados que não foram fornecidos.
- Retorne apenas a legenda final, sem explicações extras.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Erro ao chamar o serviço de IA (${response.status}): ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const legenda: string =
      Array.isArray(data.content) && data.content[0]?.type === "text" ? data.content[0].text : "";

    if (!legenda) {
      return NextResponse.json({ error: "A IA não retornou nenhum conteúdo." }, { status: 502 });
    }

    return NextResponse.json({ configured: true, legenda: legenda.trim() });
  } catch {
    return NextResponse.json({ error: "Falha de conexão com o serviço de IA." }, { status: 502 });
  }
}
