export interface Client {
  id: string;
  name: string;
  address: string;
  contact: string;
  cnpj?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  costPrice?: number; // Added cost price
}

export interface QuoteItem {
  id: string; // Unique ID for the item instance in the quote
  productId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number; // Can be overridden from product's default
  totalPrice: number;
}

export enum QuoteStatus {
  DRAFT = "Rascunho",
  PENDING = "Pendente",
  APPROVED = "Aprovado",
  REJECTED = "Rejeitado",
  CANCELED = "Cancelado"
}

export enum InstallationProgressStatus {
  NOT_STARTED = "Não Iniciado",
  SCHEDULED = "Agendado",
  IN_PROGRESS = "Em Andamento",
  COMPLETED = "Concluído",
  ON_HOLD = "Em Espera",
  CANCELED = "Cancelado",
}

export interface Quote {
  id: string; // e.g., #2492 or #2492-v1
  originalQuoteId?: string; // For versioning
  version: number;
  clientId: string;
  clientName: string; // Denormalized for quick display
  clientDetails?: Client; // Full client details for the quote
  date: string; // ISO string
  items: QuoteItem[];
  subTotal: number;
  discount: number; // Percentage or fixed amount
  totalAmount: number;
  paymentTerms: string; // e.g., "10X", "À Vista"
  installments: number; // e.g., 10
  installmentAmount: number;
  status: QuoteStatus;
  notes?: string;
  salesperson: string; // e.g., "Jorcimar"
  validityDays?: number;

  // Fields for Action Plan
  installationDate?: string;
  installationMaterials?: string;
  installationCost?: number;
  installationAddress?: string; // Defaults to clientDetails.address
  installationProgress?: InstallationProgressStatus;
  installationNotes?: string;
}

export type AppView = "list" | "form" | "mainDashboard" | "settings" | "teamManagement" | "financial" | "importantFiles" | "reports" | "focus" | "oldDashboard" | "serviceOrderDashboard";


export interface CompanyInfo {
  id?: string; // Optional ID, useful if managing multiple company profiles in future
  name: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  cnpj?: string;
}

export interface AppSettings {
  defaultSalesperson: string;
  defaultValidityDays: number;
  paymentTermSuggestions: string[];
}

export interface ManualTransaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string; // ISO string YYYY-MM-DD
  category?: string;
  notes?: string;
}

export interface ImportantLink {
  id: string;
  name: string;
  url: string;
  description?: string; // Optional description
}

// Filter type for navigating from dashboard charts to quote list
export interface QuoteListChartFilter {
  status?: QuoteStatus;
  // Potentially add other filterable fields from charts in the future
}

// Report-specific types
export interface RevenueByClientItem {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  quoteCount: number;
}

export interface RevenueByProductItem {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
}

export interface InstallationProfitabilityItem {
  quoteId: string;
  clientName: string;
  quoteTotal: number;
  installationCost?: number;
  profit: number;
  installationDate?: string;
}

export interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
}

// Pomodoro Types
export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  cyclesBeforeLongBreak: number;
}

// Audiobook Type
export interface Audiobook {
  id: string;
  title: string;
  author: string;
  url: string;
  source: string; // e.g., "LibriVox"
}

// Daily Task Kanban
export type DailyTaskStatus = 'pending' | 'doing' | 'done';

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  status: DailyTaskStatus;
  pointsAwarded?: boolean;
}

// User Management
export enum UserRole {
  ADMINISTRADOR = "Administrador",
  USUARIO = "Usuário",
  VENDEDOR = "Vendedor",
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // Added password field
}