import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/permissions";
import { fortlevAuthenticate, fortlevComponents, getFortlevCredentials, FortlevApiError } from "@/lib/fortlev/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORTLEV_SUPPLIER_NAME = "Fortlev Solar";

/**
 * Sincroniza o catálogo de componentes da Fortlev Solar (módulos, inversores,
 * estruturas...) para a tabela supplier_components. Cria o fornecedor
 * "Fortlev Solar" automaticamente na primeira sincronização, se ainda não
 * existir. Só admin pode disparar — evita qualquer usuário sobrecarregar a
 * API do fornecedor sem querer.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = await isCurrentUserAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Apenas administradores podem sincronizar." }, { status: 403 });
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

  try {
    const auth = await fortlevAuthenticate(credentials.username, credentials.password);
    const components = await fortlevComponents(auth);

    // Garante que existe um fornecedor "Fortlev Solar" para vincular os itens.
    let { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("nome", FORTLEV_SUPPLIER_NAME)
      .maybeSingle();

    if (!supplier) {
      const { data: novoFornecedor, error: erroFornecedor } = await supabase
        .from("suppliers")
        .insert({
          nome: FORTLEV_SUPPLIER_NAME,
          observacoes: "Criado automaticamente pela integração com a API oficial da Fortlev Solar.",
        })
        .select("id")
        .single();
      if (erroFornecedor || !novoFornecedor) {
        throw new Error("Não foi possível criar o fornecedor Fortlev Solar.");
      }
      supplier = novoFornecedor;
    }

    const agora = new Date().toISOString();
    const linhas = components.map((c) => ({
      supplier_id: supplier!.id,
      external_id: c.id,
      nome: c.name,
      familia: c.family,
      codigo: c.code,
      anexos: c.attachments,
      sincronizado_em: agora,
    }));

    // Upsert em lotes para não estourar limite de payload numa sincronização grande.
    const TAMANHO_LOTE = 500;
    for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      const lote = linhas.slice(i, i + TAMANHO_LOTE);
      const { error: erroUpsert } = await supabase
        .from("supplier_components")
        .upsert(lote, { onConflict: "owner_id,supplier_id,external_id" });
      if (erroUpsert) throw new Error(erroUpsert.message);
    }

    await supabase.from("integration_configs").upsert(
      {
        provider: "fortlev",
        status: "conectado",
        metadata: { scope: auth.scope, ultima_sincronizacao_itens: components.length },
        ultimo_erro: null,
        ultima_verificacao: agora,
      },
      { onConflict: "owner_id,provider" }
    );

    return NextResponse.json({ ok: true, total: components.length });
  } catch (err) {
    const mensagem =
      err instanceof FortlevApiError ? err.message : "Falha ao sincronizar com a API da Fortlev Solar.";
    await supabase.from("integration_configs").upsert(
      { provider: "fortlev", status: "erro", ultimo_erro: mensagem, ultima_verificacao: new Date().toISOString() },
      { onConflict: "owner_id,provider" }
    );
    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}
