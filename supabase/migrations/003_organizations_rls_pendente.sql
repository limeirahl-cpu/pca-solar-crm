-- PENDENTE — rodar manualmente no SQL Editor do Supabase.
-- A ferramenta de migração automática teve timeout repetido nesta única
-- instrução (não é um problema do SQL em si). A tabela public.organizations
-- foi criada com sucesso pela migração 002, mas ainda está com RLS
-- desabilitado — ou seja, hoje qualquer requisição com a chave pública
-- (anon) consegue ler/alterar essa linha. Baixo risco (só nome/CNPJ da
-- empresa, sem dados de clientes), mas vale corrigir.

alter table public.organizations enable row level security;

drop policy if exists "authenticated_read_organizations" on public.organizations;
create policy "authenticated_read_organizations" on public.organizations
  for select using (auth.uid() is not null);

drop policy if exists "admin_write_organizations" on public.organizations;
create policy "admin_write_organizations" on public.organizations
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
