-- Solar CRM — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (ou via migration) depois de criar o projeto.

create extension if not exists "pgcrypto";

-- =========================================================
-- LEADS
-- =========================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  origem text default 'outro' check (origem in ('site','indicacao','facebook','instagram','google','whatsapp','outro')),
  status text not null default 'novo' check (status in ('novo','contatado','orcamento_enviado','negociacao','fechado','perdido')),
  cidade text,
  estado text,
  consumo_kwh numeric,
  valor_estimado numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- CLIENTES
-- =========================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  tipo_pessoa text not null default 'fisica' check (tipo_pessoa in ('fisica','juridica')),
  nome text not null,
  documento text,
  email text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- ORCAMENTOS
-- =========================================================
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho','enviado','aprovado','recusado','expirado')),
  potencia_kwp numeric,
  quantidade_paineis integer,
  valor_total numeric not null default 0,
  forma_pagamento text,
  validade_dias integer not null default 15,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  descricao text not null,
  quantidade numeric not null default 1,
  valor_unitario numeric not null default 0,
  valor_total numeric not null default 0,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- USINAS (monitoramento)
-- =========================================================
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete set null,
  nome text not null,
  endereco text,
  cidade text,
  estado text,
  potencia_kwp numeric,
  quantidade_paineis integer,
  marca_inversor text,
  modelo_inversor text,
  data_instalacao date,
  status text not null default 'ativa' check (status in ('ativa','manutencao','inativa')),
  geracao_mensal_media_kwh numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plant_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  data date not null default current_date,
  geracao_kwh numeric,
  observacao text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TAREFAS / FOLLOW-UPS (CRM)
-- =========================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  titulo text not null,
  descricao text,
  data_vencimento date,
  concluida boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- INTERACOES (histórico de contato com lead/cliente)
-- =========================================================
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  tipo text not null default 'nota' check (tipo in ('nota','ligacao','whatsapp','email','visita')),
  descricao text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Índices
-- =========================================================
create index if not exists idx_leads_owner on public.leads(owner_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_clients_owner on public.clients(owner_id);
create index if not exists idx_quotes_owner on public.quotes(owner_id);
create index if not exists idx_quotes_client on public.quotes(client_id);
create index if not exists idx_quote_items_quote on public.quote_items(quote_id);
create index if not exists idx_plants_owner on public.plants(owner_id);
create index if not exists idx_plants_client on public.plants(client_id);
create index if not exists idx_plant_logs_plant on public.plant_logs(plant_id);
create index if not exists idx_tasks_owner on public.tasks(owner_id);
create index if not exists idx_interactions_lead on public.interactions(lead_id);
create index if not exists idx_interactions_client on public.interactions(client_id);

-- =========================================================
-- updated_at automático
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in select unnest(array['leads','clients','quotes','plants','tasks']) loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =========================================================
-- Row Level Security — cada usuário só vê os próprios dados
-- (pronto para virar multiusuário no futuro trocando a policy)
-- =========================================================
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.plants enable row level security;
alter table public.plant_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.interactions enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['leads','clients','quotes','quote_items','plants','plant_logs','tasks','interactions']) loop
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
  end loop;
end $$;
