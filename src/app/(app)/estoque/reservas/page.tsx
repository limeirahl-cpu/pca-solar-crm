import { createClient } from "@/lib/supabase/server";
import { StockReservationsManager } from "@/components/estoque/StockReservationsManager";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ project_id?: string; novo?: string }>;
}) {
  const { project_id, novo } = await searchParams;
  const supabase = await createClient();
  const [{ data: reservations }, { data: products }, { data: projects }] = await Promise.all([
    supabase
      .from("stock_reservations")
      .select("*, products(nome, unidade), projects(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, nome, unidade").order("nome"),
    supabase.from("projects").select("id, nome").order("nome"),
  ]);

  return (
    <StockReservationsManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialReservations={(reservations ?? []) as any}
      products={products ?? []}
      projects={projects ?? []}
      defaultProjectId={project_id}
      autoOpen={novo === "1"}
    />
  );
}
