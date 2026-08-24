import { createClient } from "@/lib/supabase/server";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";

export default async function MarketingPage() {
  const supabase = await createClient();

  const [{ data: campaigns }, { data: posts }] = await Promise.all([
    supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
    supabase
      .from("marketing_posts")
      .select("id, titulo, canal, status, data_planejada, gerado_por_ia")
      .order("data_planejada", { ascending: true }),
  ]);

  return (
    <MarketingDashboard
      campaigns={campaigns ?? []}
      posts={posts ?? []}
      aiConfigured={Boolean(process.env.ANTHROPIC_API_KEY)}
    />
  );
}
