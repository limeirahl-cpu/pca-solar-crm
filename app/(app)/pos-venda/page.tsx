import { createClient } from "@/lib/supabase/server";
import { PostSaleChecklist } from "@/components/monitoramento/PostSaleChecklist";

export default async function PosVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; project_id?: string }>;
}) {
  const { client_id, project_id } = await searchParams;
  const supabase = await createClient();

  const { data: checkins } = await supabase
    .from("post_sale_checkins")
    .select("*, projects(nome), clients(nome)")
    .order("data_prevista", { ascending: true });

  return (
    <PostSaleChecklist
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      initialCheckins={(checkins ?? []) as any}
      defaultClientId={client_id}
      defaultProjectId={project_id}
    />
  );
}
