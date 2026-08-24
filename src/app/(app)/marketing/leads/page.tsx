import { createClient } from "@/lib/supabase/server";
import { CampaignLeadsManager } from "@/components/marketing/CampaignLeadsManager";

export default async function CampaignLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string }>;
}) {
  const { campaign_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: leads }, { data: campaigns }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, marketing_campaigns(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("marketing_campaigns").select("id, nome").order("nome"),
  ]);

  return (
    <CampaignLeadsManager
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      initialLeads={(leads ?? []) as any}
      campaigns={campaigns ?? []}
      defaultCampaignId={campaign_id}
    />
  );
}
