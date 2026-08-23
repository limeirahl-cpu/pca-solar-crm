import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PropostaPublica } from "@/components/propostas/PropostaPublica";

export default async function PropostaPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase.rpc("get_proposal_by_token", { _token: token });

  if (!proposal) notFound();

  return <PropostaPublica proposal={proposal} />;
}
