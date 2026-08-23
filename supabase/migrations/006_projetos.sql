-- FASE 4 — Projetos, Homologação e Instalação
-- Aditivo/idempotente. Não altera nenhuma tabela existente.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  nome text not null,
  potencia_kwp numeric,
  responsavel_id uuid references auth.users(id) on delete set null,
  status text not null default 'venda' check (status in (
    'venda', 'documentacao', 'dimensionamento', 'homologacao', 'compra',
    'separacao', 'instalacao', 'vistoria', 'ativacao', 'entrega', 'pos_venda'
  )),
  data_venda date default current_date,
  data_prevista_entrega date,
  data_entrega date,
  checklist jsonb not null default '[]'::jsonb,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_projects_client on public.projects(client_id);
create index if not exists idx_projects_status on public.projects(status);

create table if not exists public.homologacoes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  concessionaria text,
  unidade_consumidora text,
  numero_solicitacao text,
  protocolo text,
  data_envio date,
  prazo_dias integer default 45,
  status text not null default 'pendente' check (status in (
    'pendente', 'documentacao', 'enviado', 'em_analise', 'pendencia', 'aprovado', 'rejeitado'
  )),
  pendencias_descricao text,
  data_aprovacao date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_homologacoes_owner on public.homologacoes(owner_id);
create index if not exists idx_homologacoes_project on public.homologacoes(project_id);
create index if not exists idx_homologacoes_status on public.homologacoes(status);

create table if not exists public.instalacoes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  equipe text,
  data_agendada date,
  horario text,
  status text not null default 'agendada' check (status in (
    'agendada', 'confirmada', 'em_andamento', 'concluida', 'pendente', 'cancelada'
  )),
  checklist jsonb not null default '[]'::jsonb,
  observacoes text,
  assinatura_cliente text,
  concluida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_instalacoes_owner on public.instalacoes(owner_id);
create index if not exists idx_instalacoes_project on public.instalacoes(project_id);
create index if not exists idx_instalacoes_status on public.instalacoes(status);
create index if not exists idx_instalacoes_data on public.instalacoes(data_agendada);

alter table public.projects enable row level security;
alter table public.homologacoes enable row level security;
alter table public.instalacoes enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['projects', 'homologacoes', 'instalacoes']) loop
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;
