export type LeadStatus =
  | "novo"
  | "contatado"
  | "orcamento_enviado"
  | "negociacao"
  | "fechado"
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
