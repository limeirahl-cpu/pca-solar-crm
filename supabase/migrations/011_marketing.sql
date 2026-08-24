-- Fase 9: Marketing & IA
-- Central de conteúdo, calendário editorial, geração assistida por IA com aprovação humana
-- antes de qualquer publicação. Publicação automática em redes sociais fica para a Fase 10
-- (API oficial da Meta) — aqui a marcação de "publicado" é sempre manual.
-- Não altera nem remove nada das fases anteriores.

-- ============================================================
-- 1. marketing_campaigns
-- ============================================================
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  objetivo text,
  canal text not null default 'instagram' check (canal in ('instagram', 'facebook', 'google', 'whatsapp', 'outro')),
  status text not null default 'planejada' check (status in ('planejada', 'ativa', 'pausada', 'encerrada')),
  data_inicio date,
  data_fim date,
  orcamento numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_owner on public.marketing_campaigns(owner_id);
create index if not exists idx_marketing_campaigns_status on public.marketing_campaigns(status);

-- ============================================================
-- 2. marketing_posts — ideias, rascunhos e posts agendados/publicados (calendário + criativos)
-- ============================================================
create table if not exists public.marketing_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  canal text not null default 'instagram' check (canal in ('instagram', 'facebook', 'blog', 'outro')),
  titulo text not null,
  legenda text,
  imagem_url text,
  status text not null default 'ideia' check (
    status in ('ideia', 'rascunho', 'aguardando_aprovacao', 'aprovado', 'publicado', 'cancelado')
  ),
  gerado_por_ia boolean not null default false,
  data_planejada date,
  data_publicado date,
  aprovado_por uuid references auth.users(id) on delete set null,
  aprovado_em timestamptz,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_posts_owner on public.marketing_posts(owner_id);
create index if not exists idx_marketing_posts_campaign on public.marketing_posts(campaign_id);
create index if not exists idx_marketing_posts_status on public.marketing_posts(status);
create index if not exists idx_marketing_posts_data_planejada on public.marketing_posts(data_planejada);

-- ============================================================
-- 3. leads.campaign_id — liga um lead à campanha de marketing que o originou (coluna
--    nova, opcional, aditiva — não mexe em nenhum dado existente).
-- ============================================================
alter table public.leads
  add column if not exists campaign_id uuid references public.marketing_campaigns(id) on delete set null;

create index if not exists idx_leads_campaign on public.leads(campaign_id);

-- ============================================================
-- 4. RLS + policy "owner_all" + trigger set_updated_at para as 2 tabelas novas
--    (mesmo padrão idempotente reaplicado em todas as fases anteriores)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['marketing_campaigns', 'marketing_posts']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists owner_all on public.%I', t);
    execute format(
      'create policy owner_all on public.%I using (owner_id = auth.uid()) with check (owner_id = auth.uid())',
      t
    );

    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;
