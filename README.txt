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
- **Catálogo de Fornecedores**: integração oficial com a API de parceiros da Fortlev Solar — sincroniza o catálogo de componentes automaticamente e permite cotar kits fotovoltaicos completos em tempo real (ver seção "Integração com fornecedores" abaixo).

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

## Integração com fornecedores (opcional)

O CRM já vem com uma integração oficial pronta para a **Fortlev Solar** (fornecedor de
módulos, inversores e estruturas). Ela usa a API real de parceiros da Fortlev
(`fortlevsolar.app/api`) — não é simulação nem raspagem de site.

1. Vá em **Admin → Project Settings → Environment Variables** na Vercel e adicione:
   ```
   FORTLEV_SOLAR_USERNAME=seu-usuario-do-portal-parceiro-fortlev
   FORTLEV_SOLAR_PWD=sua-senha-do-portal-parceiro-fortlev
   ```
   (é o mesmo usuário/senha que você já usa para entrar no portal de parceiros da Fortlev.
   Se ainda não tiver uma conta de parceiro, é preciso solicitar isso à Fortlev antes.)
2. Redeploy o projeto para a variável entrar em vigor.
3. No sistema, vá em **Admin → Integrações** → card "Fortlev Solar" → **Testar conexão**.
   Se conectar, o botão **Sincronizar catálogo** aparece — clique nele para trazer o
   catálogo de componentes para **Estoque → Catálogo de Fornecedores**.

A Fortlev não vende item avulso com preço fixo — o preço só existe cotado dentro de um
kit fotovoltaico completo (potência + cidade + voltagem). Por isso o catálogo sincronizado
não tem preço; cotações de kit acontecem em tempo real via `/api/integracoes/fortlev/kits`.

Outros fornecedores podem ser cadastrados manualmente em **Estoque → Fornecedores** e
seus produtos importados por planilha — a integração automática por API, como a da
Fortlev, é feita caso a caso conforme cada fornecedor disponibilizar algo parecido.

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

---
*Última verificação de deploy: forçando atualização de produção.*

*Reconectando domínio de produção.*
