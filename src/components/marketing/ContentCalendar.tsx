"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { MarketingPost } from "@/lib/database.types";
import { POST_CANAL_LABEL, POST_STATUS_LABEL, POST_STATUS_TONE } from "@/lib/marketing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export type ScheduledPost = MarketingPost & { marketing_campaigns: { nome: string } | null };

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function ContentCalendar({
  initialPosts,
  currentUserId,
}: {
  initialPosts: ScheduledPost[];
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { locale: ptBR });
    const end = endOfWeek(endOfMonth(monthCursor), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts.forEach((p) => {
      if (!p.data_planejada) return;
      const key = p.data_planejada.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts]);

  const selectedPosts = postsByDate[selectedDate] ?? [];

  async function aprovar(post: ScheduledPost) {
    const aprovado_em = new Date().toISOString();
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, status: "aprovado", aprovado_por: currentUserId, aprovado_em } : p))
    );
    await supabase
      .from("marketing_posts")
      .update({ status: "aprovado", aprovado_por: currentUserId, aprovado_em })
      .eq("id", post.id);
    router.refresh();
  }

  async function marcarPublicado(post: ScheduledPost) {
    const data_publicado = new Date().toISOString().slice(0, 10);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "publicado", data_publicado } : p)));
    await supabase.from("marketing_posts").update({ status: "publicado", data_publicado }).eq("id", post.id);
    router.refresh();
  }

  async function cancelar(post: ScheduledPost) {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "cancelado" } : p)));
    await supabase.from("marketing_posts").update({ status: "cancelado" }).eq("id", post.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Calendário de Conteúdo</h1>
        <p className="text-sm text-muted">
          Posts agendados a partir dos criativos. Aprovação humana obrigatória antes de marcar como publicado —
          a publicação em si é manual, feita direto na rede social.
        </p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={() => setMonthCursor((m) => subMonths(m, 1))}>
            ← Anterior
          </Button>
          <h2 className="text-sm font-semibold capitalize text-foreground">
            {format(monthCursor, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button size="sm" variant="outline" onClick={() => setMonthCursor((m) => addMonths(m, 1))}>
            Próximo →
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayPosts = postsByDate[key] ?? [];
            const selected = key === selectedDate;
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "flex min-h-[64px] flex-col items-start rounded-md border p-1.5 text-left text-xs transition-colors",
                  isSameMonth(day, monthCursor) ? "text-foreground" : "text-muted/50",
                  selected ? "border-primary bg-primary/5" : "border-border hover:bg-black/[0.02]",
                  isToday(day) && !selected ? "border-primary/40" : ""
                )}
              >
                <span className="font-medium">{format(day, "d")}</span>
                {dayPosts.length > 0 && (
                  <span className="mt-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                    {dayPosts.length} post{dayPosts.length > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">
            {format(new Date(`${selectedDate}T00:00:00`), "dd 'de' MMMM", { locale: ptBR })}
          </h3>
        </div>
        {selectedPosts.length === 0 ? (
          <EmptyState title="Nenhum post agendado para este dia" />
        ) : (
          <ul className="divide-y divide-border">
            {selectedPosts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{POST_CANAL_LABEL[post.canal]}</Badge>
                    <Badge tone={POST_STATUS_TONE[post.status]}>{POST_STATUS_LABEL[post.status]}</Badge>
                    {post.gerado_por_ia && <span className="text-xs" title="Gerado por IA">✨</span>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{post.titulo}</p>
                  {post.legenda && <p className="line-clamp-2 text-sm text-muted">{post.legenda}</p>}
                  {post.marketing_campaigns?.nome && (
                    <p className="mt-1 text-xs text-muted">Campanha: {post.marketing_campaigns.nome}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {post.status === "aguardando_aprovacao" && (
                    <Button size="sm" variant="secondary" onClick={() => aprovar(post)}>
                      Aprovar
                    </Button>
                  )}
                  {post.status === "aprovado" && (
                    <Button size="sm" variant="secondary" onClick={() => marcarPublicado(post)}>
                      Marcar publicado
                    </Button>
                  )}
                  {(post.status === "aguardando_aprovacao" || post.status === "aprovado") && (
                    <Button size="sm" variant="ghost" onClick={() => cancelar(post)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
