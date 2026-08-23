import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { QuotesTable } from "@/components/quotes/QuotesTable";

export default async function OrcamentosPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, clients(nome), leads(nome)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted">Monte propostas comerciais e acompanhe o status.</p>
        </div>
        <Link href="/orcamentos/novo">
          <Button>+ Novo orçamento</Button>
        </Link>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <QuotesTable quotes={(quotes ?? []) as any} />
    </div>
  );
}
