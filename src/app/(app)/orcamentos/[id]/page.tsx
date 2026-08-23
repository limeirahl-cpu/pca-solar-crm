import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteDetail } from "@/components/quotes/QuoteDetail";

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*, clients(*), leads(*)").eq("id", id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("ordem"),
  ]);

  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <Link href="/orcamentos" className="text-sm font-medium text-primary hover:underline print:hidden">
        ← Voltar para orçamentos
      </Link>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <QuoteDetail quote={quote as any} items={items ?? []} />
    </div>
  );
}
