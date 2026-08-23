-- FASE 7 — Financeiro
-- Aditivo/idempotente. Não altera nenhuma tabela existente.
-- Uma única tabela de lançamentos (financial_entries) cobre Contas a Receber,
-- Contas a Pagar, Fluxo de Caixa e Comissões — diferenciados por `tipo` e
-- pelo vínculo com vendedor/cliente/fornecedor, evitando tabelas paralelas
-- quase idênticas para o mesmo conceito de "lançamento financeiro".

create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_financial_categories_owner on public.financial_categories(owner_id);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  tipo text not null check (tipo in ('receita', 'despesa')),
  categoria_id uuid references public.financial_categories(id) on delete set null,
  descricao text not null,
  valor numeric not null check (valor > 0),
  client_id uuid references public.clients(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  proposal_id uuid references public.proposals(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  ordem_servico_id uuid references public.ordens_servico(id) on delete set null,
  vendedor_id uuid references auth.users(id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_vencimento date not null default current_date,
  data_pagamento date,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_financial_entries_owner on public.financial_entries(owner_id);
create index if not exists idx_financial_entries_tipo on public.financial_entries(tipo);
create index if not exists idx_financial_entries_status on public.financial_entries(status);
create index if not exists idx_financial_entries_vencimento on public.financial_entries(data_vencimento);
create index if not exists idx_financial_entries_categoria on public.financial_entries(categoria_id);
create index if not exists idx_financial_entries_client on public.financial_entries(client_id);
create index if not exists idx_financial_entries_project on public.financial_entries(project_id);
create index if not exists idx_financial_entries_vendedor on public.financial_entries(vendedor_id);

alter table public.financial_categories enable row level security;
alter table public.financial_entries enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['financial_categories', 'financial_entries']) loop
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
