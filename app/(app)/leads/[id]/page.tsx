import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/leads/LeadDetail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead }, { data: interactions }, { data: tasks }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase
      .from("interactions")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("lead_id", id)
      .order("data_vencimento", { ascending: true }),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <Link href="/leads" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para leads
      </Link>
      <LeadDetail lead={lead} interactions={interactions ?? []} tasks={tasks ?? []} />
    </div>
  );
}
