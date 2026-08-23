import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetail } from "@/components/clients/ClientDetail";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: quotes }, { data: plants }, { data: interactions }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase
        .from("quotes")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("plants")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("interactions")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para clientes
      </Link>
      <ClientDetail
        client={client}
        quotes={quotes ?? []}
        plants={plants ?? []}
        interactions={interactions ?? []}
      />
    </div>
  );
}
