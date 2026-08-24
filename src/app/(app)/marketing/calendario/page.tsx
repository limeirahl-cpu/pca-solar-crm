import { createClient } from "@/lib/supabase/server";
import { ContentCalendar } from "@/components/marketing/ContentCalendar";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: userData }] = await Promise.all([
    supabase
      .from("marketing_posts")
      .select("*, marketing_campaigns(nome)")
      .not("data_planejada", "is", null)
      .order("data_planejada", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  return (
    <ContentCalendar
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      initialPosts={(posts ?? []) as any}
      currentUserId={userData.user?.id ?? ""}
    />
  );
}
