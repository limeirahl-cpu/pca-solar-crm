-- Fase 10 (parte 1): Arquitetura de integrações oficiais
-- Guarda apenas STATUS e metadados não-sensíveis de cada integração (WhatsApp Business API,
-- Instagram Graph API). As credenciais reais (access tokens) NUNCA ficam no banco — vivem
-- como variáveis de ambiente no servidor (Vercel), no mesmo padrão do ANTHROPIC_API_KEY da
-- Fase 9. Enquanto a variável de ambiente correspondente não existir, o status fica
-- "nao_configurado" e a interface mostra isso com honestidade, sem simular conexão.
-- Não altera nem remove nada das fases anteriores.

create table if not exists public.integration_configs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider text not null check (provider in ('whatsapp', 'instagram')),
  status text not null default 'nao_configurado' check (status in ('nao_configurado', 'conectado', 'erro')),
  metadata jsonb not null default '{}'::jsonb,
  ultimo_erro text,
  ultima_verificacao timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, provider)
);

create index if not exists idx_integration_configs_owner on public.integration_configs(owner_id);

do $$
declare
  t text;
begin
  foreach t in array array['integration_configs']
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
