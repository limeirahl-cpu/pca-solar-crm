import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlantDetail } from "@/components/plants/PlantDetail";

export default async function UsinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plant }, { data: logs }] = await Promise.all([
    supabase.from("plants").select("*, clients(nome)").eq("id", id).single(),
    supabase.from("plant_logs").select("*").eq("plant_id", id).order("data", { ascending: true }),
  ]);

  if (!plant) notFound();

  return (
    <div className="space-y-6">
      <Link href="/usinas" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para usinas
      </Link>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PlantDetail plant={plant as any} logs={logs ?? []} />
    </div>
  );
}
