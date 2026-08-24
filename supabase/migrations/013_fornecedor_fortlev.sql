-- Fase 10 (parte 2): Integração com fornecedores — Fortlev Solar
-- Aditivo/idempotente. Não altera nem remove nada das fases anteriores.
--
-- A Fortlev Solar tem uma API oficial de parceiros (https://fortlevsolar.app/api).
-- As credenciais (usuário/senha do parceiro) NUNCA ficam no banco — vivem como
-- variáveis de ambiente no servidor (Vercel), no mesmo padrão do WhatsApp/Instagram.
--
-- A API da Fortlev não vende "item com preço fixo": ela expõe (1) um catálogo de
-- componentes (módulos, inversores, estruturas — sem preço unitário) e (2) uma
-- cotação de kits fotovoltaicos completos sob demanda (dado potência/cidade/etc,
-- devolve kits prontos com preço total). Por isso guardamos o catálogo de
-- componentes (para exibir/buscar), e os kits são sempre cotados em tempo real
-- (não fazem sentido "guardados", já que o preço depende dos parâmetros do pedido).

-- Adiciona 'fortlev' como provider válido em integration_configs.
alter table public.integration_configs drop constraint if exists integration_configs_provider_check;
alter table public.integration_configs
  add constraint integration_configs_provider_check
  check (provider in ('whatsapp', 'instagram', 'fortlev'));

-- Catálogo de componentes sincronizado de cada fornecedor com integração automática.
create table if not exists public.supplier_components (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  external_id text not null,
  nome text not null,
  familia text,
  codigo text,
  anexos jsonb not null default '[]'::jsonb,
  sincronizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, supplier_id, external_id)
);

create index if not exists idx_supplier_components_owner on public.supplier_components(owner_id);
create index if not exists idx_supplier_components_supplier on public.supplier_components(supplier_id);
create index if not exists idx_supplier_components_familia on public.supplier_components(familia);
create index if not exists idx_supplier_components_nome on public.supplier_components(nome);

do $$
declare
  t text;
begin
  foreach t in array array['supplier_components']
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
