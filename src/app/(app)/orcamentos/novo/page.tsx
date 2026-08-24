import { createClient } from "@/lib/supabase/server";
import { NewQuoteForm } from "@/components/quotes/NewQuoteForm";

export default async function NovoOrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; lead_id?: string }>;
}) {
  const { client_id, lead_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, { data: leads }] = await Promise.all([
    supabase.from("clients").select("id, nome").order("nome"),
    supabase.from("leads").select("id, nome").order("nome"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Novo orçamento</h1>
        <p className="text-sm text-muted">Monte a proposta com os itens do sistema fotovoltaico.</p>
      </div>
      <NewQuoteForm
        clients={clients ?? []}
        leads={leads ?? []}
        defaultClientId={client_id}
        defaultLeadId={lead_id}
      />
    </div>
  );
}
