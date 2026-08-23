-- FASE 2 — Funil de vendas completo
-- Amplia o status do lead para as 13 etapas do funil do roadmap + "perdido".
-- Aditivo/idempotente. Não há dados em produção ainda (tabela leads vazia),
-- mas os UPDATEs de segurança abaixo protegem qualquer linha que já exista.

update public.leads set status = 'primeiro_contato' where status = 'contatado';
update public.leads set status = 'orcamento' where status = 'orcamento_enviado';
update public.leads set status = 'pos_venda' where status = 'fechado';

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (
  status in (
    'novo',
    'primeiro_contato',
    'qualificacao',
    'visita_agendada',
    'visita_realizada',
    'dimensionamento',
    'orcamento',
    'negociacao',
    'aprovacao',
    'contrato',
    'pagamento',
    'instalacao',
    'pos_venda',
    'perdido'
  )
);
