import { createClient } from "@/lib/supabase/server";
import { SimuladorForm } from "@/components/simulador/SimuladorForm";

export default async function SimuladorPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; lead_id?: string }>;
}) {
  const { client_id, lead_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, { data: leads }, { data: selectedClient }, { data: selectedLead }] =
    await Promise.all([
      supabase.from("clients").select("id, nome").order("nome"),
      supabase.from("leads").select("id, nome").order("nome"),
      client_id
        ? supabase.from("clients").select("*").eq("id", client_id).single()
        : Promise.resolve({ data: null }),
      lead_id
        ? supabase.from("leads").select("*").eq("id", lead_id).single()
        : Promise.resolve({ data: null }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Simulador solar</h1>
        <p className="text-sm text-muted">
          Dimensione o sistema a partir do consumo do cliente e gere uma proposta comercial.
        </p>
      </div>
      <SimuladorForm
        clients={clients ?? []}
        leads={leads ?? []}
        defaultClientId={client_id}
        defaultLeadId={lead_id}
        selectedClient={selectedClient}
        selectedLead={selectedLead}
      />
    </div>
  );
}
