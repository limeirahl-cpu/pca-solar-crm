import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PurchaseDetail } from "@/components/estoque/PurchaseDetail";

export default async function CompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: purchase } = await supabase.from("purchases").select("*").eq("id", id).single();
  if (!purchase) notFound();

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase.from("suppliers").select("id, nome").order("nome"),
    supabase.from("products").select("id, nome, unidade, valor_unitario").order("nome"),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/compras" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para compras
      </Link>
      <PurchaseDetail purchase={purchase} suppliers={suppliers ?? []} products={products ?? []} />
    </div>
  );
}
