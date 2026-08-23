# Solar CRM

Sistema interno para a empresa: captura de leads, orçamentos, cadastro de clientes e monitoramento de usinas instaladas.

Stack: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase (banco de dados e autenticação) + Vercel (hospedagem)**.

## Funcionalidades

- **Leads**: cadastro, funil de status (novo → contatado → orçamento enviado → negociação → fechado/perdido), conversão em cliente com 1 clique.
- **Clientes**: cadastro completo (PF/PJ), histórico de interações (ligações, WhatsApp, e-mail, visitas, notas), orçamentos e usinas vinculados.
- **Orçamentos**: itens com quantidade/valor unitário, cálculo automático do total, status (rascunho/enviado/aprovado/recusado/expirado), visualização para impressão/PDF.
- **Usinas (monitoramento)**: cadastro das usinas instaladas, status (ativa/manutenção/inativa), histórico de geração de energia lançado manualmente + gráfico.
- **Tarefas**: follow-ups vinculados a leads/clientes com data de vencimento.
- **Dashboard**: visão geral com métricas e atalhos.

O banco já está modelado com `owner_id` em todas as tabelas (via Row Level Security), pronto para no futuro virar multiusuário sem reescrever nada.

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (use o email da empresa).
2. No painel do projeto, vá em **SQL Editor** → cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) → **Run**. Isso cria todas as tabelas, índices e as políticas de segurança (RLS).
3. Vá em **Authentication → Users → Add user** e crie o usuário administrador (o email/senha que você vai usar para logar no sistema). Marque "Auto Confirm User".
4. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## 3. Rodar localmente (opcional)

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 e faça login com o usuário criado no passo 1.3.

## 4. Publicar no GitHub

```bash
git remote add origin <URL_DO_SEU_REPOSITORIO>
git branch -M main
git push -u origin main
```

## 5. Deploy na Vercel

1. Em [vercel.com](https://vercel.com), importe o repositório do GitHub.
2. Em **Environment Variables**, adicione as mesmas duas variáveis do passo 2.
3. Deploy.

Pronto — o site fica no ar com deploy automático a cada `git push`.
