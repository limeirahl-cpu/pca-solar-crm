import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetail } from "@/components/estoque/ProductDetail";

export default async function ProdutoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  const [{ data: suppliers }, { data: movements }, { data: reservations }] = await Promise.all([
    supabase.from("suppliers").select("id, nome").order("nome"),
    supabase.from("stock_movements").select("*").eq("product_id", id).order("created_at", { ascending: false }),
    supabase.from("stock_reservations").select("*").eq("product_id", id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/estoque/produtos" className="text-sm font-medium text-primary hover:underline">
        ← Voltar para produtos
      </Link>
      <ProductDetail
        product={product}
        suppliers={suppliers ?? []}
        movements={movements ?? []}
        reservations={reservations ?? []}
      />
    </div>
  );
}
