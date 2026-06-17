/** Outbox operation types */
export type OutboxOperationType =
  | 'sale_batch'
  | 'giveaway'
  | 'stock_report'
  | 'price_report'
  | 'inventory_assign'
  | 'field_note'
  | 'report_images'
  | 'survey_response'
  | 'store_create';

export type OutboxStatus = 'pending' | 'syncing' | 'done' | 'failed' | 'blocked';

export type ReportKind = 'availability' | 'count';

export interface SaleLineItem {
  productVariantId: string;
  quantity: number;
  price: number;
  lineTotal?: number;
}

export interface SaleBatchPayload {
  items: SaleLineItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  engagementType?: string;
  notes?: string;
  sentiment?: number;
  imageUrl?: string;
  storeId?: string | null;
  storeName?: string;
  storeCounty?: string;
  latitude?: number | null;
  longitude?: number | null;
  includeCustomerPurchase?: boolean;
  projectId?: string | null;
  taskId?: string | null;
  customerId?: string | null;
}

export interface GiveawayPayload {
  productsGiven: Array<{
    product_variant_id: string;
    product_name?: string;
    name?: string;
    quantity: number;
  }>;
  totalItems: number;
  recipientName?: string | null;
  recipientPhone?: string | null;
  notes?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  storeId?: string | null;
  projectId?: string | null;
  recordedAt?: string;
  logInteraction?: {
    interactionType: string;
    customerName: string;
    customerPhone?: string;
    notes: string;
    sentiment: number;
  };
  saveCustomer?: {
    name: string;
    phone?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
  };
}

export interface StockReportRow {
  product_variant_id: string;
  stock_level?: string | null;
  opening_stock?: number | null;
  quantity_sold?: number | null;
  closing_stock?: number | null;
}

export interface StockReportPayload {
  reportType: 'morning' | 'evening';
  reportKind: ReportKind;
  workDate: string;
  storeId?: string | null;
  rows: StockReportRow[];
}

export interface PriceReportRow {
  product_variant_id: string;
  price: number;
  stock_level?: string | null;
  measurement?: string | null;
}

export interface PriceReportPayload {
  workDate: string;
  storeId?: string | null;
  rows: PriceReportRow[];
}

export interface InventoryAssignPayload {
  entries: Array<{
    productVariantId: string;
    quantity: number;
    name?: string | null;
  }>;
}

export interface FieldNotePayload {
  content: string;
  noteType?: string;
}

export interface ReportImagesPayload {
  attachmentIds: string[];
  bucket: string;
  folder: string;
}

export interface SurveyResponsePayload {
  surveyTemplateId: string;
  surveyName?: string;
  responses: Record<string, unknown>;
  startedAt?: string;
  completedAt: string;
  durationSeconds: number;
  storeId?: string | null;
  storeName?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  audioAttachmentId?: string;
  audioUrl?: string;
  points?: number;
  source: 'surveys_page' | 'store_success';
  taskId?: string | null;
}

export interface StoreCreatePayload {
  storeName: string;
  contact?: string | null;
  latitude: number;
  longitude: number;
  county?: string | null;
  country?: string | null;
}

export type OutboxPayload =
  | SaleBatchPayload
  | GiveawayPayload
  | StockReportPayload
  | PriceReportPayload
  | InventoryAssignPayload
  | FieldNotePayload
  | ReportImagesPayload
  | SurveyResponsePayload
  | StoreCreatePayload;

export interface OutboxItem {
  id: string;
  type: OutboxOperationType;
  payload: OutboxPayload;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: number;
  workspaceId: string;
  agentId: string;
}

export interface InventorySnapshotItem {
  product_variant_id: string;
  name: string | null;
  amount_issued: number;
  price: number;
  sku: string | null;
}

export interface InventorySnapshot {
  workspaceId: string;
  agentId: string;
  items: InventorySnapshotItem[];
  updatedAt: number;
}

export interface AttachmentRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  createdAt: number;
}

export interface EntityAlias {
  clientId: string;
  serverId: string;
  entityType: 'store';
  createdAt: number;
}

export interface CachedSurveyTemplate {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  questions: unknown[];
  points?: number;
  estimated_duration_minutes?: number | null;
  cachedAt: number;
}

export const FLUSH_PRIORITY: Record<OutboxOperationType, number> = {
  store_create: 0,
  report_images: 1,
  field_note: 2,
  stock_report: 3,
  price_report: 3,
  survey_response: 4,
  sale_batch: 5,
  giveaway: 5,
  inventory_assign: 5,
};

export const OFFLINE_WRITE_PATHS = {
  sale_batch: ['interactions', 'inventory_transactions', 'agent_actions', 'customer_purchases?'],
  giveaway: ['giveaways', 'inventory_transactions', 'customers?', 'interactions?'],
  stock_report: ['daily_stock_reports'],
  price_report: ['store_price_reports'],
  inventory_assign: ['agent_task_inventory'],
  field_note: ['notes'],
  report_images: ['storage:store_images'],
  survey_response: ['interactions', 'survey_responses', 'agent_actions'],
  store_create: ['stores', 'project_plans.target_stores'],
} as const;
