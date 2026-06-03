/** Inventory-related outbox operation types */
export type OutboxOperationType =
  | 'sale_batch'
  | 'giveaway'
  | 'stock_report'
  | 'inventory_assign';

export type OutboxStatus = 'pending' | 'syncing' | 'done' | 'failed' | 'blocked';

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
  /** Store-visit flow */
  storeId?: string | null;
  storeName?: string;
  storeCounty?: string;
  latitude?: number | null;
  longitude?: number | null;
  includeCustomerPurchase?: boolean;
  projectId?: string | null;
  taskId?: string | null;
  /** RecordSale flow: link purchases to an existing customer row */
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
  /** Also log interaction after giveaway (GiveProducts page) */
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
  workDate: string;
  storeId?: string | null;
  rows: StockReportRow[];
}

export interface InventoryAssignPayload {
  entries: Array<{
    productVariantId: string;
    quantity: number;
    name?: string | null;
  }>;
}

export type OutboxPayload =
  | SaleBatchPayload
  | GiveawayPayload
  | StockReportPayload
  | InventoryAssignPayload;

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

/** Tables touched per operation — see INVENTORY_WRITE_PATHS.md */
export const INVENTORY_WRITE_PATHS = {
  sale_batch: ['interactions', 'inventory_transactions', 'agent_actions', 'customer_purchases?'],
  giveaway: ['giveaways', 'inventory_transactions', 'customers?', 'interactions?'],
  stock_report: ['daily_stock_reports'],
  inventory_assign: ['agent_task_inventory'],
} as const;
