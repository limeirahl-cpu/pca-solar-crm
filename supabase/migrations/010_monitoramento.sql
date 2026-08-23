-- Fase 8: Pós-venda & Monitoramento avançado
-- Alertas de geração/offline por usina, checklist automático de pós-venda (D+1 a D+365)
-- e arquitetura desacoplada (config por usina) para futuras integrações de API de inversores.
-- Não altera nem remove nada das fases anteriores.

-- ============================================================
-- 1. plant_alerts — alertas de geração baixa, ausência de dados, offline ou manual
-- ============================================================
create table if not exists public.plant_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  tipo text not null check (tipo in ('geracao_baixa', 'sem_dados', 'offline', 'manual')),
  severidade text not null default 'media' check (severidade in ('baixa', 'media', 'alta')),
  status text not null default 'aberto' check (status in ('aberto', 'resolvido')),
  titulo text not null,
  descricao text,
  valor_esperado numeric,
  valor_registrado numeric,
  resolvido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plant_alerts_owner on public.plant_alerts(owner_id);
create index if not exists idx_plant_alerts_plant on public.plant_alerts(plant_id);
create index if not exists idx_plant_alerts_status on public.plant_alerts(status);
create index if not exists idx_plant_alerts_tipo on public.plant_alerts(tipo);

-- ============================================================
-- 2. plant_monitoring_configs — config de integração de monitoramento por usina (1:1)
--    Arquitetura desacoplada: hoje só "manual" está ativo; provedores de API de
--    inversores ficam explicitamente "não configurados" até uma integração real existir.
-- ============================================================
create table if not exists public.plant_monitoring_configs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plant_id uuid not null unique references public.plants(id) on delete cascade,
  provider text not null default 'manual' check (
    provider in ('manual', 'growatt', 'fronius', 'deye', 'solaredge', 'huawei', 'outro')
  ),
  status text not null default 'manual' check (status in ('manual', 'nao_configurado', 'conectado', 'erro')),
  identificador_externo text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plant_monitoring_configs_owner on public.plant_monitoring_configs(owner_id);

-- ============================================================
-- 3. post_sale_checkins — checklist automático de pós-venda (D+1, D+7, D+30, D+90, D+180, D+365)
-- ============================================================
create table if not exists public.post_sale_checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  etapa text not null check (etapa in ('d1', 'd7', 'd30', 'd90', 'd180', 'd365')),
  data_prevista date not null,
  status text not null default 'pendente' check (status in ('pendente', 'realizado', 'nao_respondeu', 'nao_aplicavel')),
  descricao text not null,
  observacoes text,
  realizado_em date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_post_sale_checkins_owner on public.post_sale_checkins(owner_id);
create index if not exists idx_post_sale_checkins_project on public.post_sale_checkins(project_id);
create index if not exists idx_post_sale_checkins_client on public.post_sale_checkins(client_id);
create index if not exists idx_post_sale_checkins_status on public.post_sale_checkins(status);
create index if not exists idx_post_sale_checkins_data on public.post_sale_checkins(data_prevista);

-- ============================================================
-- 4. Trigger: ao mover um projeto para o estágio "entrega" pela primeira vez,
--    gera automaticamente os 6 checkins de pós-venda (D+1 a D+365).
--    SECURITY DEFINER seguindo o mesmo padrão de apply_stock_movement() (fase 6).
-- ============================================================
create or replace function public.handle_project_entrega()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  data_base date;
begin
  if new.status = 'entrega' and (old.status is distinct from 'entrega') then
    if new.data_entrega is null then
      new.data_entrega := current_date;
    end if;
    data_base := new.data_entrega;

    insert into public.post_sale_checkins (owner_id, project_id, client_id, etapa, data_prevista, descricao)
    select new.owner_id, new.id, new.client_id, e.etapa, data_base + e.dias, e.descricao
    from (
      values
        ('d1', 1, 'Contato D+1: confirmar satisfação inicial e funcionamento do sistema'),
        ('d7', 7, 'Contato D+7: verificar geração na primeira semana de uso'),
        ('d30', 30, 'Contato D+30: revisão de 1 mês, tirar dúvidas sobre o app/monitoramento'),
        ('d90', 90, 'Contato D+90: revisão trimestral de geração'),
        ('d180', 180, 'Contato D+180: revisão semestral, oferecer limpeza preventiva'),
        ('d365', 365, 'Contato D+365: revisão anual, avaliar ampliação e renovação de garantia')
    ) as e(etapa, dias, descricao)
    where not exists (
      select 1 from public.post_sale_checkins c where c.project_id = new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_project_entrega on public.projects;
create trigger trg_project_entrega
  before update on public.projects
  for each row execute function public.handle_project_entrega();

-- ============================================================
-- 5. RLS + policy "owner_all" + trigger set_updated_at para as 3 tabelas novas
--    (mesmo padrão idempotente reaplicado em todas as fases anteriores)
-- ============================================================
do $$
declare
  t text;
begin
  foreach t in array array['plant_alerts', 'plant_monitoring_configs', 'post_sale_checkins']
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
