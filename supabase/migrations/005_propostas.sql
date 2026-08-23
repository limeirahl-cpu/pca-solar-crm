-- FASE 3 — Simulador solar & Propostas
-- Aditivo/idempotente. Cria a tabela de propostas (documento comercial gerado
-- a partir de um orçamento) e duas funções SECURITY DEFINER que dão acesso
-- público controlado por token secreto, sem expor a tabela inteira via RLS.

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero integer generated always as identity,
  quote_id uuid references public.quotes(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  public_token uuid not null default gen_random_uuid() unique,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado', 'aprovado', 'recusado')),

  -- snapshot do cliente/site no momento da proposta (documento formal, não deve
  -- mudar retroativamente se o cadastro do cliente for editado depois)
  cliente_nome text not null,
  cliente_documento text,
  cliente_telefone text,
  cliente_email text,
  cliente_endereco text,
  cliente_cidade text,
  cliente_estado text,
  consumo_kwh_mes numeric,

  -- sistema dimensionado
  potencia_kwp numeric,
  quantidade_modulos integer,
  potencia_modulo_wp numeric,
  marca_modulo text,
  inversor_marca text,
  inversor_modelo text,
  estrutura_tipo text default 'Metálica para telha cerâmica/fibrocimento',
  geracao_estimada_kwh_mes numeric,
  economia_estimada_mensal numeric,
  economia_estimada_anual numeric,
  payback_meses numeric,
  area_ocupada_m2 numeric,

  -- comercial
  itens jsonb not null default '[]'::jsonb,
  investimento_total numeric not null default 0,
  condicoes_pagamento text,
  garantias text default '12 meses de garantia de instalação; garantia de fábrica dos módulos e inversor conforme fabricante.',
  prazo_execucao_dias integer default 30,
  observacoes text,

  approved_at timestamptz,
  approved_by_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_owner on public.proposals(owner_id);
create index if not exists idx_proposals_quote on public.proposals(quote_id);
create index if not exists idx_proposals_client on public.proposals(client_id);
create index if not exists idx_proposals_token on public.proposals(public_token);

alter table public.proposals enable row level security;

drop policy if exists "owner_all" on public.proposals;
create policy "owner_all" on public.proposals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop trigger if exists trg_set_updated_at on public.proposals;
create trigger trg_set_updated_at before update on public.proposals
  for each row execute function public.set_updated_at();

-- Acesso público de leitura por token secreto (link enviado ao cliente).
-- SECURITY DEFINER: só devolve a linha cujo token bate — nunca a tabela toda.
create or replace function public.get_proposal_by_token(_token uuid)
returns public.proposals
language sql
stable
security definer
set search_path = public
as $$
  select * from public.proposals where public_token = _token limit 1;
$$;

-- Aprovação pelo cliente via link público. Só move rascunho/enviado -> aprovado,
-- nunca sobrescreve uma proposta já recusada/aprovada por engano.
create or replace function public.approve_proposal(_token uuid, _client_name text)
returns public.proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.proposals;
begin
  update public.proposals
  set status = 'aprovado', approved_at = now(), approved_by_name = _client_name
  where public_token = _token and status in ('rascunho', 'enviado')
  returning * into result;

  return result;
end;
$$;

grant execute on function public.get_proposal_by_token(uuid) to anon, authenticated;
grant execute on function public.approve_proposal(uuid, text) to anon, authenticated;
