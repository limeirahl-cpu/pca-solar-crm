import { createClient } from "@/lib/supabase/server";
import { PostsBoard } from "@/components/marketing/PostsBoard";

export default async function CriativosPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: campaigns }] = await Promise.all([
    supabase
      .from("marketing_posts")
      .select("*, marketing_campaigns(nome)")
      .order("created_at", { ascending: false }),
    supabase.from("marketing_campaigns").select("id, nome").order("nome"),
  ]);

  return (
    <PostsBoard
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      initialPosts={(posts ?? []) as any}
      campaigns={campaigns ?? []}
    />
  );
}
