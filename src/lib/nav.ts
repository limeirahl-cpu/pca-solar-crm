export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Módulo já implementado e conectado ao banco. */
  ready: boolean;
};

export type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "principal",
    label: "Principal",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "📊", ready: true }],
  },
  {
    key: "comercial",
    label: "Comercial",
    items: [
      { href: "/leads", label: "Leads", icon: "🧲", ready: true },
      { href: "/clientes", label: "Clientes", icon: "👥", ready: true },
      { href: "/funil", label: "Funil de Vendas", icon: "🧭", ready: true },
      { href: "/orcamentos", label: "Orçamentos", icon: "🧾", ready: true },
      { href: "/propostas", label: "Propostas", icon: "📄", ready: false },
      { href: "/contratos", label: "Contratos", icon: "✍️", ready: false },
      { href: "/financiamentos", label: "Financiamentos", icon: "🏦", ready: false },
    ],
  },
  {
    key: "projetos",
    label: "Projetos",
    items: [
      { href: "/projetos", label: "Projetos", icon: "📁", ready: false },
      { href: "/homologacoes", label: "Homologações", icon: "🏛️", ready: false },
      { href: "/instalacoes", label: "Instalações", icon: "🛠️", ready: false },
      { href: "/agenda", label: "Agenda", icon: "📅", ready: false },
      { href: "/checklists", label: "Checklists", icon: "☑️", ready: false },
    ],
  },
  {
    key: "servicos",
    label: "Serviços",
    items: [
      { href: "/ordens-servico", label: "Ordens de Serviço", icon: "🧰", ready: false },
      { href: "/manutencao", label: "Manutenção", icon: "🔧", ready: false },
      { href: "/limpeza", label: "Limpeza", icon: "🧽", ready: false },
      { href: "/servicos/monitoramento", label: "Monitoramento", icon: "📡", ready: false },
      { href: "/garantias", label: "Garantias", icon: "🛡️", ready: false },
      { href: "/ampliacoes", label: "Ampliações", icon: "➕", ready: false },
    ],
  },
  {
    key: "estoque",
    label: "Estoque",
    items: [
      { href: "/estoque/produtos", label: "Produtos", icon: "📦", ready: false },
      { href: "/estoque/equipamentos", label: "Equipamentos", icon: "⚙️", ready: false },
      { href: "/estoque", label: "Estoque", icon: "🏬", ready: false },
      { href: "/estoque/movimentacoes", label: "Movimentações", icon: "🔁", ready: false },
      { href: "/estoque/reservas", label: "Reservas", icon: "🔒", ready: false },
      { href: "/compras", label: "Compras", icon: "🛒", ready: false },
      { href: "/fornecedores", label: "Fornecedores", icon: "🚚", ready: false },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    items: [
      { href: "/financeiro", label: "Dashboard financeiro", icon: "💰", ready: false },
      { href: "/financeiro/receber", label: "Contas a receber", icon: "⬇️", ready: false },
      { href: "/financeiro/pagar", label: "Contas a pagar", icon: "⬆️", ready: false },
      { href: "/financeiro/fluxo-caixa", label: "Fluxo de caixa", icon: "📈", ready: false },
      { href: "/financeiro/comissoes", label: "Comissões", icon: "🤝", ready: false },
      { href: "/financeiro/categorias", label: "Categorias", icon: "🏷️", ready: false },
      { href: "/financeiro/relatorios", label: "Relatórios", icon: "📑", ready: false },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    items: [
      { href: "/marketing", label: "Central de Marketing", icon: "📣", ready: false },
      { href: "/marketing/calendario", label: "Calendário de Conteúdo", icon: "🗓️", ready: false },
      { href: "/marketing/instagram", label: "Instagram", icon: "📷", ready: false },
      { href: "/marketing/campanhas", label: "Campanhas", icon: "🎯", ready: false },
      { href: "/marketing/criativos", label: "Criativos", icon: "🎨", ready: false },
      { href: "/marketing/leads", label: "Leads de campanhas", icon: "🧲", ready: false },
    ],
  },
  {
    key: "monitoramento",
    label: "Monitoramento",
    items: [
      { href: "/usinas", label: "Usinas", icon: "🔆", ready: true },
      { href: "/usinas/geracao", label: "Geração", icon: "⚡", ready: false },
      { href: "/usinas/alertas", label: "Alertas", icon: "🚨", ready: false },
      { href: "/usinas/performance", label: "Performance", icon: "📶", ready: false },
    ],
  },
  {
    key: "relatorios",
    label: "Relatórios",
    items: [
      { href: "/relatorios/comercial", label: "Comercial", icon: "📊", ready: false },
      { href: "/relatorios/financeiro", label: "Financeiro", icon: "📊", ready: false },
      { href: "/relatorios/operacional", label: "Operacional", icon: "📊", ready: false },
      { href: "/relatorios/estoque", label: "Estoque", icon: "📊", ready: false },
      { href: "/relatorios/marketing", label: "Marketing", icon: "📊", ready: false },
      { href: "/relatorios/geracao-solar", label: "Geração Solar", icon: "📊", ready: false },
    ],
  },
  {
    key: "tarefas",
    label: "Follow-up",
    items: [{ href: "/tarefas", label: "Tarefas", icon: "✅", ready: true }],
  },
  {
    key: "admin",
    label: "Administração",
    items: [
      { href: "/admin/usuarios", label: "Usuários", icon: "🧑‍💼", ready: true },
      { href: "/admin/permissoes", label: "Permissões", icon: "🔐", ready: true },
      { href: "/admin/configuracoes", label: "Configurações", icon: "⚙️", ready: false },
      { href: "/admin/integracoes", label: "Integrações", icon: "🔌", ready: false },
      { href: "/admin/logs", label: "Logs / Auditoria", icon: "🗂️", ready: true },
    ],
  },
];

/** Lista de módulos usada na tela de permissões — cobre o CRM+ERP completo. */
export const PERMISSION_MODULES = [
  "leads",
  "clientes",
  "orcamentos",
  "propostas",
  "contratos",
  "projetos",
  "homologacoes",
  "instalacoes",
  "ordens_servico",
  "estoque",
  "compras",
  "financeiro",
  "marketing",
  "usinas",
  "relatorios",
  "configuracoes",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_MODULE_LABEL: Record<PermissionModule, string> = {
  leads: "Leads",
  clientes: "Clientes",
  orcamentos: "Orçamentos",
  propostas: "Propostas",
  contratos: "Contratos",
  projetos: "Projetos",
  homologacoes: "Homologações",
  instalacoes: "Instalações",
  ordens_servico: "Ordens de Serviço",
  estoque: "Estoque",
  compras: "Compras",
  financeiro: "Financeiro",
  marketing: "Marketing",
  usinas: "Usinas / Monitoramento",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
};
