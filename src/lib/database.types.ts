export type LeadStatus =
  | "novo"
  | "primeiro_contato"
  | "qualificacao"
  | "visita_agendada"
  | "visita_realizada"
  | "dimensionamento"
  | "orcamento"
  | "negociacao"
  | "aprovacao"
  | "contrato"
  | "pagamento"
  | "instalacao"
  | "pos_venda"
  | "perdido";

export type LeadOrigem =
  | "site"
  | "indicacao"
  | "facebook"
  | "instagram"
  | "google"
  | "whatsapp"
  | "outro";

export type QuoteStatus = "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado";

export type ProposalStatus = "rascunho" | "enviado" | "aprovado" | "recusado";

export type ProposalItem = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

export type PlantStatus = "ativa" | "manutencao" | "inativa";

export type TipoPessoa = "fisica" | "juridica";

export type InteractionTipo = "nota" | "ligacao" | "whatsapp" | "email" | "visita";

export type AppRole = "admin" | "vendedor";

export type LeadTemperatura = "frio" | "morno" | "quente";

export type Lead = {
  id: string;
  owner_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: LeadOrigem;
  status: LeadStatus;
  cidade: string | null;
  estado: string | null;
  consumo_kwh: number | null;
  valor_estimado: number | null;
  observacoes: string | null;
  whatsapp: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  cep: string | null;
  campanha: string | null;
  anuncio: string | null;
  vendedor_id: string | null;
  temperatura: LeadTemperatura | null;
  probabilidade: number | null;
  proximo_contato: string | null;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
};

export type Permission = {
  id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  module: string;
  action: string;
  record_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
  created_at: string;
};

export type Proposal = {
  id: string;
  owner_id: string;
  numero: number;
  quote_id: string | null;
  client_id: string | null;
  lead_id: string | null;
  public_token: string;
  status: ProposalStatus;
  cliente_nome: string;
  cliente_documento: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  cliente_endereco: string | null;
  cliente_cidade: string | null;
  cliente_estado: string | null;
  consumo_kwh_mes: number | null;
  potencia_kwp: number | null;
  quantidade_modulos: number | null;
  potencia_modulo_wp: number | null;
  marca_modulo: string | null;
  inversor_marca: string | null;
  inversor_modelo: string | null;
  estrutura_tipo: string | null;
  geracao_estimada_kwh_mes: number | null;
  economia_estimada_mensal: number | null;
  economia_estimada_anual: number | null;
  payback_meses: number | null;
  area_ocupada_m2: number | null;
  itens: ProposalItem[];
  investimento_total: number;
  condicoes_pagamento: string | null;
  garantias: string | null;
  prazo_execucao_dias: number | null;
  observacoes: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectStatus =
  | "venda"
  | "documentacao"
  | "dimensionamento"
  | "homologacao"
  | "compra"
  | "separacao"
  | "instalacao"
  | "vistoria"
  | "ativacao"
  | "entrega"
  | "pos_venda";

export type ChecklistItem = {
  item: string;
  done: boolean;
};

export type Project = {
  id: string;
  owner_id: string;
  numero: number;
  client_id: string;
  quote_id: string | null;
  proposal_id: string | null;
  nome: string;
  potencia_kwp: number | null;
  responsavel_id: string | null;
  status: ProjectStatus;
  data_venda: string | null;
  data_prevista_entrega: string | null;
  data_entrega: string | null;
  checklist: ChecklistItem[];
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type HomologacaoStatus =
  | "pendente"
  | "documentacao"
  | "enviado"
  | "em_analise"
  | "pendencia"
  | "aprovado"
  | "rejeitado";

export type Homologacao = {
  id: string;
  owner_id: string;
  project_id: string;
  concessionaria: string | null;
  unidade_consumidora: string | null;
  numero_solicitacao: string | null;
  protocolo: string | null;
  data_envio: string | null;
  prazo_dias: number | null;
  status: HomologacaoStatus;
  pendencias_descricao: string | null;
  data_aprovacao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type InstalacaoStatus =
  | "agendada"
  | "confirmada"
  | "em_andamento"
  | "concluida"
  | "pendente"
  | "cancelada";

export type Instalacao = {
  id: string;
  owner_id: string;
  project_id: string;
  client_id: string | null;
  equipe: string | null;
  data_agendada: string | null;
  horario: string | null;
  status: InstalacaoStatus;
  checklist: ChecklistItem[];
  observacoes: string | null;
  assinatura_cliente: string | null;
  concluida_em: string | null;
  created_at: string;
  updated_at: string;
};

export type OrdemServicoTipo = "manutencao" | "limpeza" | "garantia" | "ampliacao" | "vistoria" | "outro";

export type OrdemServicoStatus = "aberta" | "agendada" | "em_andamento" | "concluida" | "cancelada";

export type OrdemServicoPrioridade = "baixa" | "media" | "alta" | "urgente";

export type OrdemServico = {
  id: string;
  owner_id: string;
  numero: number;
  client_id: string;
  project_id: string | null;
  plant_id: string | null;
  tipo: OrdemServicoTipo;
  titulo: string;
  descricao: string | null;
  status: OrdemServicoStatus;
  prioridade: OrdemServicoPrioridade;
  responsavel_id: string | null;
  data_abertura: string;
  data_agendada: string | null;
  data_conclusao: string | null;
  checklist: ChecklistItem[];
  valor_servico: number | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  assinatura_cliente: string | null;
  concluida_em: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductCategoria = "modulo" | "inversor" | "estrutura" | "cabo" | "conector" | "protecao" | "outro";

export type Product = {
  id: string;
  owner_id: string;
  codigo: string | null;
  nome: string;
  categoria: ProductCategoria;
  unidade: string;
  fornecedor_id: string | null;
  estoque_atual: number;
  estoque_minimo: number;
  valor_unitario: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  owner_id: string;
  nome: string;
  cnpj_cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  contato_nome: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseStatus = "rascunho" | "enviado" | "aprovado" | "recebido" | "cancelado";

export type PurchaseItem = {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

export type Purchase = {
  id: string;
  owner_id: string;
  numero: number;
  supplier_id: string | null;
  status: PurchaseStatus;
  data_pedido: string | null;
  data_prevista_entrega: string | null;
  data_recebimento: string | null;
  itens: PurchaseItem[];
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovementTipo = "entrada" | "saida" | "ajuste";

export type StockMovementMotivo = "compra" | "instalacao" | "devolucao" | "perda" | "ajuste_inventario" | "outro";

export type StockMovement = {
  id: string;
  owner_id: string;
  product_id: string;
  tipo: StockMovementTipo;
  quantidade: number;
  motivo: StockMovementMotivo;
  project_id: string | null;
  purchase_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export type StockReservationStatus = "reservada" | "consumida" | "cancelada";

export type StockReservation = {
  id: string;
  owner_id: string;
  product_id: string;
  project_id: string | null;
  quantidade: number;
  status: StockReservationStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type FinancialCategoriaTipo = "receita" | "despesa";

export type FinancialCategory = {
  id: string;
  owner_id: string;
  nome: string;
  tipo: FinancialCategoriaTipo;
  created_at: string;
  updated_at: string;
};

export type FinancialEntryStatus = "pendente" | "pago" | "cancelado";

export type FinancialEntry = {
  id: string;
  owner_id: string;
  numero: number;
  tipo: FinancialCategoriaTipo;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  client_id: string | null;
  supplier_id: string | null;
  project_id: string | null;
  proposal_id: string | null;
  purchase_id: string | null;
  ordem_servico_id: string | null;
  vendedor_id: string | null;
  status: FinancialEntryStatus;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlantAlertTipo = "geracao_baixa" | "sem_dados" | "offline" | "manual";
export type PlantAlertSeveridade = "baixa" | "media" | "alta";
export type PlantAlertStatus = "aberto" | "resolvido";

export type PlantAlert = {
  id: string;
  owner_id: string;
  plant_id: string;
  tipo: PlantAlertTipo;
  severidade: PlantAlertSeveridade;
  status: PlantAlertStatus;
  titulo: string;
  descricao: string | null;
  valor_esperado: number | null;
  valor_registrado: number | null;
  resolvido_em: string | null;
  created_at: string;
  updated_at: string;
};

export type MonitoringProvider =
  | "manual"
  | "growatt"
  | "fronius"
  | "deye"
  | "solaredge"
  | "huawei"
  | "outro";
export type MonitoringConfigStatus = "manual" | "nao_configurado" | "conectado" | "erro";

export type PlantMonitoringConfig = {
  id: string;
  owner_id: string;
  plant_id: string;
  provider: MonitoringProvider;
  status: MonitoringConfigStatus;
  identificador_externo: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckinEtapa = "d1" | "d7" | "d30" | "d90" | "d180" | "d365";
export type CheckinStatus = "pendente" | "realizado" | "nao_respondeu" | "nao_aplicavel";

export type PostSaleCheckin = {
  id: string;
  owner_id: string;
  project_id: string;
  client_id: string | null;
  etapa: CheckinEtapa;
  data_prevista: string;
  status: CheckinStatus;
  descricao: string;
  observacoes: string | null;
  realizado_em: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaignCanal = "instagram" | "facebook" | "google" | "whatsapp" | "outro";
export type MarketingCampaignStatus = "planejada" | "ativa" | "pausada" | "encerrada";

export type MarketingCampaign = {
  id: string;
  owner_id: string;
  nome: string;
  objetivo: string | null;
  canal: MarketingCampaignCanal;
  status: MarketingCampaignStatus;
  data_inicio: string | null;
  data_fim: string | null;
  orcamento: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingPostCanal = "instagram" | "facebook" | "blog" | "outro";
export type MarketingPostStatus =
  | "ideia"
  | "rascunho"
  | "aguardando_aprovacao"
  | "aprovado"
  | "publicado"
  | "cancelado";

export type MarketingPost = {
  id: string;
  owner_id: string;
  campaign_id: string | null;
  canal: MarketingPostCanal;
  titulo: string;
  legenda: string | null;
  imagem_url: string | null;
  status: MarketingPostStatus;
  gerado_por_ia: boolean;
  data_planejada: string | null;
  data_publicado: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationProvider = "whatsapp" | "instagram" | "fortlev";
export type IntegrationStatus = "nao_configurado" | "conectado" | "erro";

export type IntegrationConfig = {
  id: string;
  owner_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  metadata: Record<string, string | number | null>;
  ultimo_erro: string | null;
  ultima_verificacao: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierComponentAttachment = { key: string; path: string };

export type SupplierComponent = {
  id: string;
  owner_id: string;
  supplier_id: string;
  external_id: string;
  nome: string;
  familia: string | null;
  codigo: string | null;
  anexos: SupplierComponentAttachment[];
  sincronizado_em: string;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  owner_id: string;
  lead_id: string | null;
  tipo_pessoa: TipoPessoa;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  owner_id: string;
  numero: number;
  lead_id: string | null;
  client_id: string | null;
  status: QuoteStatus;
  potencia_kwp: number | null;
  quantidade_paineis: number | null;
  valor_total: number;
  forma_pagamento: string | null;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  owner_id: string;
  quote_id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  ordem: number;
  created_at: string;
};

export type Plant = {
  id: string;
  owner_id: string;
  client_id: string;
  quote_id: string | null;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  potencia_kwp: number | null;
  quantidade_paineis: number | null;
  marca_inversor: string | null;
  modelo_inversor: string | null;
  data_instalacao: string | null;
  status: PlantStatus;
  geracao_mensal_media_kwh: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlantLog = {
  id: string;
  owner_id: string;
  plant_id: string;
  data: string;
  geracao_kwh: number | null;
  observacao: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  owner_id: string;
  lead_id: string | null;
  client_id: string | null;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null;
  concluida: boolean;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  owner_id: string;
  lead_id: string | null;
  client_id: string | null;
  tipo: InteractionTipo;
  descricao: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Partial<Client>;
        Update: Partial<Client>;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: Partial<Quote>;
        Update: Partial<Quote>;
        Relationships: [];
      };
      quote_items: {
        Row: QuoteItem;
        Insert: Partial<QuoteItem>;
        Update: Partial<QuoteItem>;
        Relationships: [];
      };
      plants: {
        Row: Plant;
        Insert: Partial<Plant>;
        Update: Partial<Plant>;
        Relationships: [];
      };
      plant_logs: {
        Row: PlantLog;
        Insert: Partial<PlantLog>;
        Update: Partial<PlantLog>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task>;
        Update: Partial<Task>;
        Relationships: [];
      };
      interactions: {
        Row: Interaction;
        Insert: Partial<Interaction>;
        Update: Partial<Interaction>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRole;
        Insert: Partial<UserRole>;
        Update: Partial<UserRole>;
        Relationships: [];
      };
      permissions: {
        Row: Permission;
        Insert: Partial<Permission>;
        Update: Partial<Permission>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Organization>;
        Update: Partial<Organization>;
        Relationships: [];
      };
      proposals: {
        Row: Proposal;
        Insert: Partial<Proposal>;
        Update: Partial<Proposal>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project>;
        Update: Partial<Project>;
        Relationships: [];
      };
      homologacoes: {
        Row: Homologacao;
        Insert: Partial<Homologacao>;
        Update: Partial<Homologacao>;
        Relationships: [];
      };
      instalacoes: {
        Row: Instalacao;
        Insert: Partial<Instalacao>;
        Update: Partial<Instalacao>;
        Relationships: [];
      };
      ordens_servico: {
        Row: OrdemServico;
        Insert: Partial<OrdemServico>;
        Update: Partial<OrdemServico>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
        Relationships: [];
      };
      suppliers: {
        Row: Supplier;
        Insert: Partial<Supplier>;
        Update: Partial<Supplier>;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: Partial<Purchase>;
        Update: Partial<Purchase>;
        Relationships: [];
      };
      stock_movements: {
        Row: StockMovement;
        Insert: Partial<StockMovement>;
        Update: Partial<StockMovement>;
        Relationships: [];
      };
      stock_reservations: {
        Row: StockReservation;
        Insert: Partial<StockReservation>;
        Update: Partial<StockReservation>;
        Relationships: [];
      };
      financial_categories: {
        Row: FinancialCategory;
        Insert: Partial<FinancialCategory>;
        Update: Partial<FinancialCategory>;
        Relationships: [];
      };
      financial_entries: {
        Row: FinancialEntry;
        Insert: Partial<FinancialEntry>;
        Update: Partial<FinancialEntry>;
        Relationships: [];
      };
      plant_alerts: {
        Row: PlantAlert;
        Insert: Partial<PlantAlert>;
        Update: Partial<PlantAlert>;
        Relationships: [];
      };
      plant_monitoring_configs: {
        Row: PlantMonitoringConfig;
        Insert: Partial<PlantMonitoringConfig>;
        Update: Partial<PlantMonitoringConfig>;
        Relationships: [];
      };
      post_sale_checkins: {
        Row: PostSaleCheckin;
        Insert: Partial<PostSaleCheckin>;
        Update: Partial<PostSaleCheckin>;
        Relationships: [];
      };
      marketing_campaigns: {
        Row: MarketingCampaign;
        Insert: Partial<MarketingCampaign>;
        Update: Partial<MarketingCampaign>;
        Relationships: [];
      };
      marketing_posts: {
        Row: MarketingPost;
        Insert: Partial<MarketingPost>;
        Update: Partial<MarketingPost>;
        Relationships: [];
      };
      integration_configs: {
        Row: IntegrationConfig;
        Insert: Partial<IntegrationConfig>;
        Update: Partial<IntegrationConfig>;
        Relationships: [];
      };
      supplier_components: {
        Row: SupplierComponent;
        Insert: Partial<SupplierComponent>;
        Update: Partial<SupplierComponent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_proposal_by_token: {
        Args: { _token: string };
        Returns: Proposal;
      };
      approve_proposal: {
        Args: { _token: string; _client_name: string };
        Returns: Proposal;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
