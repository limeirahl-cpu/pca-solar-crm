import { createClient } from "@/lib/supabase/server";
import { ClientsManager } from "@/components/clients/ClientsManager";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted">Cadastro completo de clientes pessoa física e jurídica.</p>
      </div>
      <ClientsManager initialClients={clients ?? []} />
    </div>
  );
}
