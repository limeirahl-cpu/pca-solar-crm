-- FASE 6 — Estoque & Compras
-- Aditivo/idempotente. Não altera nenhuma tabela existente.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  cnpj_cpf text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  estado text,
  contato_nome text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suppliers_owner on public.suppliers(owner_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  codigo text,
  nome text not null,
  categoria text not null default 'outro' check (categoria in (
    'modulo', 'inversor', 'estrutura', 'cabo', 'conector', 'protecao', 'outro'
  )),
  unidade text not null default 'un',
  fornecedor_id uuid references public.suppliers(id) on delete set null,
  estoque_atual numeric not null default 0,
  estoque_minimo numeric not null default 0,
  valor_unitario numeric,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_owner on public.products(owner_id);
create index if not exists idx_products_categoria on public.products(categoria);
create index if not exists idx_products_fornecedor on public.products(fornecedor_id);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'rascunho' check (status in (
    'rascunho', 'enviado', 'aprovado', 'recebido', 'cancelado'
  )),
  data_pedido date default current_date,
  data_prevista_entrega date,
  data_recebimento date,
  itens jsonb not null default '[]'::jsonb,
  valor_total numeric not null default 0,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_purchases_owner on public.purchases(owner_id);
create index if not exists idx_purchases_supplier on public.purchases(supplier_id);
create index if not exists idx_purchases_status on public.purchases(status);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste')),
  quantidade numeric not null check (
    (tipo in ('entrada', 'saida') and quantidade > 0) or (tipo = 'ajuste' and quantidade <> 0)
  ),
  motivo text not null default 'outro' check (motivo in (
    'compra', 'instalacao', 'devolucao', 'perda', 'ajuste_inventario', 'outro'
  )),
  project_id uuid references public.projects(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_owner on public.stock_movements(owner_id);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id);
create index if not exists idx_stock_movements_purchase on public.stock_movements(purchase_id);

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  quantidade numeric not null check (quantidade > 0),
  status text not null default 'reservada' check (status in ('reservada', 'consumida', 'cancelada')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_reservations_owner on public.stock_reservations(owner_id);
create index if not exists idx_stock_reservations_product on public.stock_reservations(product_id);
create index if not exists idx_stock_reservations_project on public.stock_reservations(project_id);

-- Mantém products.estoque_atual sempre consistente com o histórico de movimentações,
-- em vez de depender do app atualizar dois lugares (evita divergência de estoque).
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.tipo = 'entrada' then
    update public.products set estoque_atual = estoque_atual + new.quantidade where id = new.product_id;
  elsif new.tipo = 'saida' then
    update public.products set estoque_atual = estoque_atual - new.quantidade where id = new.product_id;
  elsif new.tipo = 'ajuste' then
    update public.products set estoque_atual = estoque_atual + new.quantidade where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_stock_movement on public.stock_movements;
create trigger trg_apply_stock_movement
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_reservations enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['suppliers', 'products', 'purchases', 'stock_movements', 'stock_reservations']) loop
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
  end loop;

  for t in select unnest(array['suppliers', 'products', 'purchases', 'stock_reservations']) loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I;', t);
    execute format(
      'create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;
