import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetail } from "@/components/projetos/ProjectDetail";

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [{ data: client }, { data: homologacoes }, { data: instalacoes }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", project.client_id).single(),
    supabase
      .from("homologacoes")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("instalacoes")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/projetos" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para projetos
      </Link>
      <ProjectDetail
        project={project}
        client={client ?? null}
        homologacoes={homologacoes ?? []}
        instalacoes={instalacoes ?? []}
      />
    </div>
  );
}
