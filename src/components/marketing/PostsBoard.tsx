"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MarketingPost, MarketingPostCanal } from "@/lib/database.types";
import {
  CRIATIVO_STATUS,
  POST_CANAL,
  POST_CANAL_LABEL,
  POST_STATUS_LABEL,
  POST_STATUS_TONE,
} from "@/lib/marketing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";

export type PostWithCampaign = MarketingPost & { marketing_campaigns: { nome: string } | null };
type Option = { id: string; nome: string };

const emptyForm = {
  titulo: "",
  canal: "instagram" as MarketingPostCanal,
  campaign_id: "",
  legenda: "",
};

export function PostsBoard({
  initialPosts,
  campaigns,
}: {
  initialPosts: PostWithCampaign[];
  campaigns: Option[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<PostWithCampaign[]>(initialPosts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [geradoPorIa, setGeradoPorIa] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<PostWithCampaign | null>(null);
  const [dataAgendamento, setDataAgendamento] = useState(new Date().toISOString().slice(0, 10));

  const criativos = useMemo(
    () => posts.filter((p) => CRIATIVO_STATUS.includes(p.status)),
    [posts]
  );

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setGeradoPorIa(false);
    setAiError(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(post: PostWithCampaign) {
    setEditingId(post.id);
    setForm({
      titulo: post.titulo,
      canal: post.canal,
      campaign_id: post.campaign_id ?? "",
      legenda: post.legenda ?? "",
    });
    setGeradoPorIa(post.gerado_por_ia);
    setAiError(null);
    setError(null);
    setModalOpen(true);
  }

  async function gerarComIA() {
    if (!form.titulo.trim()) {
      setAiError("Preencha o título/tema antes de gerar com IA.");
      return;
    }
    setGerando(true);
    setAiError(null);
    try {
      const res = await fetch("/api/marketing/gerar-legenda", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tema: form.titulo, canal: POST_CANAL_LABEL[form.canal] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Erro ao gerar legenda.");
      } else {
        setForm((f) => ({ ...f, legenda: data.legenda }));
        setGeradoPorIa(true);
      }
    } catch {
      setAiError("Falha de conexão ao gerar legenda.");
    }
    setGerando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError("Informe um título.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      titulo: form.titulo,
      canal: form.canal,
      campaign_id: form.campaign_id || null,
      legenda: form.legenda || null,
      gerado_por_ia: geradoPorIa,
    };

    if (editingId) {
      const { data, error: updError } = await supabase
        .from("marketing_posts")
        .update(payload)
        .eq("id", editingId)
        .select("*, marketing_campaigns(nome)")
        .single();
      if (updError) {
        setError(updError.message);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPosts((prev) => prev.map((p) => (p.id === editingId ? (data as any as PostWithCampaign) : p)));
        setModalOpen(false);
        router.refresh();
      }
    } else {
      const { data, error: insError } = await supabase
        .from("marketing_posts")
        .insert({ ...payload, status: "ideia" })
        .select("*, marketing_campaigns(nome)")
        .single();
      if (insError) {
        setError(insError.message);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPosts((prev) => [data as any as PostWithCampaign, ...prev]);
        setModalOpen(false);
        router.refresh();
      }
    }
    setSaving(false);
  }

  async function handleAgendar(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduling) return;
    const { error: updError } = await supabase
      .from("marketing_posts")
      .update({ status: "aguardando_aprovacao", data_planejada: dataAgendamento })
      .eq("id", scheduling.id);
    if (!updError) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === scheduling.id
            ? { ...p, status: "aguardando_aprovacao", data_planejada: dataAgendamento }
            : p
        )
      );
      setScheduling(null);
      router.refresh();
    }
  }

  async function cancelar(post: PostWithCampaign) {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: "cancelado" } : p)));
    await supabase.from("marketing_posts").update({ status: "cancelado" }).eq("id", post.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Criativos</h1>
          <p className="text-sm text-muted">
            Banco de ideias e rascunhos de conteúdo — escreva na mão ou peça ajuda da IA, revise e agende.
          </p>
        </div>
        <Button onClick={openNew}>+ Novo criativo</Button>
      </div>

      {criativos.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhum criativo no banco"
            description="Crie uma ideia de post — com ou sem ajuda da IA — para depois agendar no calendário."
            action={<Button onClick={openNew}>+ Novo criativo</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {criativos.map((post) => (
            <Card key={post.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="blue">{POST_CANAL_LABEL[post.canal]}</Badge>
                <Badge tone={POST_STATUS_TONE[post.status]}>{POST_STATUS_LABEL[post.status]}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {post.titulo} {post.gerado_por_ia && <span title="Gerado por IA">✨</span>}
              </h3>
              {post.legenda && <p className="line-clamp-4 text-sm text-muted">{post.legenda}</p>}
              {post.marketing_campaigns?.nome && (
                <p className="text-xs text-muted">Campanha: {post.marketing_campaigns.nome}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(post)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setScheduling(post);
                    setDataAgendamento(new Date().toISOString().slice(0, 10));
                  }}
                >
                  Agendar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => cancelar(post)}>
                  Cancelar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar criativo" : "Novo criativo"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-danger">{error}</p>}
          <FieldGroup label="Título / tema" required>
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Economia na conta de luz com energia solar"
            />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Canal">
              <Select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value as MarketingPostCanal })}>
                {POST_CANAL.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Campanha (opcional)">
              <Select value={form.campaign_id} onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}>
                <option value="">Nenhuma</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <FieldGroup
            label="Legenda"
            className="space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">{geradoPorIa ? "✨ Rascunho gerado por IA — revise antes de aprovar." : ""}</span>
              <Button type="button" size="sm" variant="outline" onClick={gerarComIA} disabled={gerando}>
                {gerando ? "Gerando..." : "✨ Gerar com IA"}
              </Button>
            </div>
            <Textarea
              value={form.legenda}
              onChange={(e) => {
                setForm({ ...form, legenda: e.target.value });
                setGeradoPorIa(false);
              }}
              className="min-h-[140px]"
            />
            {aiError && <p className="text-xs text-danger">{aiError}</p>}
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={scheduling !== null} onClose={() => setScheduling(null)} title="Agendar no calendário">
        <form onSubmit={handleAgendar} className="space-y-3">
          <p className="text-sm text-muted">
            O post vai para &quot;Aguardando aprovação&quot; na data escolhida — a publicação em si continua manual.
          </p>
          <FieldGroup label="Data planejada">
            <Input type="date" value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} required />
          </FieldGroup>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setScheduling(null)}>
              Cancelar
            </Button>
            <Button type="submit">Agendar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
