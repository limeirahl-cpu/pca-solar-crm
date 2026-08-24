import { createClient } from "@/lib/supabase/server";
import { ProjectsManager } from "@/components/projetos/ProjectsManager";

export default async function ProjetosPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase.from("projects").select("*, clients(nome)").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, nome").order("nome"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Projetos</h1>
        <p className="text-sm text-muted">Da venda até a entrega, em 11 etapas.</p>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProjectsManager initialProjects={(projects ?? []) as any} clients={clients ?? []} />
    </div>
  );
}
