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
