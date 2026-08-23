import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropostaEditor } from "@/components/propostas/PropostaEditor";

export default async function PropostaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", id).single();

  if (!proposal) notFound();

  return (
    <div className="space-y-6">
      <Link href="/propostas" className="text-sm font-medium text-primary hover:underline print:hidden">
        ← Voltar para propostas
      </Link>
      <PropostaEditor proposal={proposal} />
    </div>
  );
}
