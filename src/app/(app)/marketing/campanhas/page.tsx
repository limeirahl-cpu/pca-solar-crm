import { createClient } from "@/lib/supabase/server";
import { CampaignsManager } from "@/components/marketing/CampaignsManager";

export default async function CampanhasPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return <CampaignsManager initialCampaigns={campaigns ?? []} />;
}
