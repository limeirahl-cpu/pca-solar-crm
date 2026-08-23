-- FASE 5 — Ordens de Serviço (manutenção, limpeza, garantia, ampliação, vistoria)
-- Aditivo/idempotente. Não altera nenhuma tabela existente.
-- Uma única tabela cobre os módulos de Serviços do menu (manutenção, limpeza,
-- garantias, ampliações e a própria tela de "Ordens de Serviço"), diferenciados
-- pelo campo `tipo` — evita 5 tabelas quase idênticas para o mesmo conceito.

create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  plant_id uuid references public.plants(id) on delete set null,
  tipo text not null default 'manutencao' check (tipo in (
    'manutencao', 'limpeza', 'garantia', 'ampliacao', 'vistoria', 'outro'
  )),
  titulo text not null,
  descricao text,
  status text not null default 'aberta' check (status in (
    'aberta', 'agendada', 'em_andamento', 'concluida', 'cancelada'
  )),
  prioridade text not null default 'media' check (prioridade in (
    'baixa', 'media', 'alta', 'urgente'
  )),
  responsavel_id uuid references auth.users(id) on delete set null,
  data_abertura date not null default current_date,
  data_agendada date,
  data_conclusao date,
  checklist jsonb not null default '[]'::jsonb,
  valor_servico numeric,
  forma_pagamento text,
  observacoes text,
  assinatura_cliente text,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ordens_servico_owner on public.ordens_servico(owner_id);
create index if not exists idx_ordens_servico_client on public.ordens_servico(client_id);
create index if not exists idx_ordens_servico_project on public.ordens_servico(project_id);
create index if not exists idx_ordens_servico_plant on public.ordens_servico(plant_id);
create index if not exists idx_ordens_servico_tipo on public.ordens_servico(tipo);
create index if not exists idx_ordens_servico_status on public.ordens_servico(status);

alter table public.ordens_servico enable row level security;

drop policy if exists "owner_all" on public.ordens_servico;
create policy "owner_all" on public.ordens_servico
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop trigger if exists trg_set_updated_at on public.ordens_servico;
create trigger trg_set_updated_at before update on public.ordens_servico
  for each row execute function public.set_updated_at();
