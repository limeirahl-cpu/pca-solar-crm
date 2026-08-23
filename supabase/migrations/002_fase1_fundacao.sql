-- FASE 1 — Fundação: permissões, auditoria e preparação multiempresa
-- Migração ADITIVA — não remove nem altera dados existentes.
-- Segura para rodar mais de uma vez (idempotente).

-- =========================================================
-- Função auxiliar SECURITY DEFINER para checar papel sem recursão de RLS
-- =========================================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- =========================================================
-- ORGANIZATIONS — preparação para multiempresa (ainda não usada nas policies)
-- =========================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  cnpj text,
  created_at timestamptz not null default now()
);

insert into public.organizations (name, legal_name, cnpj)
select 'PCA Solar', 'PCA SOLAR LTDA', '53.534.162/0001-76'
where not exists (select 1 from public.organizations);

-- =========================================================
-- PERMISSÕES GRANULARES POR USUÁRIO/MÓDULO
-- =========================================================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module)
);

alter table public.permissions enable row level security;

drop policy if exists "self_or_admin_read_permissions" on public.permissions;
create policy "self_or_admin_read_permissions" on public.permissions
  for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin_insert_permissions" on public.permissions;
create policy "admin_insert_permissions" on public.permissions
  for insert with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin_update_permissions" on public.permissions;
create policy "admin_update_permissions" on public.permissions
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin_delete_permissions" on public.permissions;
create policy "admin_delete_permissions" on public.permissions
  for delete using (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- AUDITORIA — log de ações administrativas/sensíveis
-- =========================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  module text not null,
  action text not null,
  record_id uuid,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_module on public.audit_logs(module);

alter table public.audit_logs enable row level security;

drop policy if exists "admin_read_audit" on public.audit_logs;
create policy "admin_read_audit" on public.audit_logs
  for select using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "authenticated_insert_audit" on public.audit_logs;
create policy "authenticated_insert_audit" on public.audit_logs
  for insert with check (auth.uid() is not null);

-- =========================================================
-- USER_ROLES — permitir que administradores gerenciem papéis de todos
-- (mantém a policy original de cada usuário ver o próprio papel)
-- =========================================================
drop policy if exists "admins_manage_user_roles" on public.user_roles;
create policy "admins_manage_user_roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- PROFILES — permitir que administradores insiram perfil de novos usuários
-- =========================================================
drop policy if exists "admins_insert_profiles" on public.profiles;
create policy "admins_insert_profiles" on public.profiles
  for insert with check (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Garante que o usuário atual (dono da empresa) seja admin
-- =========================================================
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where u.email = 'limeiranoss@hotmail.com'
  and not exists (
    select 1 from public.user_roles ur
    where ur.user_id = u.id and ur.role = 'admin'::public.app_role
  );

-- =========================================================
-- LEADS — novos campos para o CRM completo (Fase 3), aditivo e não-destrutivo
-- =========================================================
alter table public.leads add column if not exists whatsapp text;
alter table public.leads add column if not exists cpf_cnpj text;
alter table public.leads add column if not exists endereco text;
alter table public.leads add column if not exists cep text;
alter table public.leads add column if not exists campanha text;
alter table public.leads add column if not exists anuncio text;
alter table public.leads add column if not exists vendedor_id uuid references auth.users(id) on delete set null;
alter table public.leads add column if not exists temperatura text check (temperatura in ('frio','morno','quente'));
alter table public.leads add column if not exists probabilidade integer check (probabilidade between 0 and 100);
alter table public.leads add column if not exists proximo_contato timestamptz;
