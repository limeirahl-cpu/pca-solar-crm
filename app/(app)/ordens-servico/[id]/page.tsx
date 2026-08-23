import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrdemServicoDetail } from "@/components/ordens/OrdemServicoDetail";

export default async function OrdemServicoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ordem } = await supabase.from("ordens_servico").select("*").eq("id", id).single();
  if (!ordem) notFound();

  const [{ data: client }, { data: project }, { data: plant }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", ordem.client_id).single(),
    ordem.project_id
      ? supabase.from("projects").select("nome").eq("id", ordem.project_id).single()
      : Promise.resolve({ data: null }),
    ordem.plant_id
      ? supabase.from("plants").select("nome").eq("id", ordem.plant_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/ordens-servico" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para ordens de serviço
      </Link>
      <OrdemServicoDetail
        ordem={ordem}
        client={client ?? null}
        projectNome={project?.nome ?? null}
        plantNome={plant?.nome ?? null}
      />
    </div>
  );
}
