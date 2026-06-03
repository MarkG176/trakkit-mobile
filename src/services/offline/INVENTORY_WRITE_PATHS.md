# Inventory write paths (unified via `inventoryWriteService`)

| Operation | UI entry points | Server tables |
|-----------|-----------------|---------------|
| `sale_batch` | `useSalesForm`, `RecordSale`, `StoreSuccessDialog` | `interactions`, `inventory_transactions`, `agent_actions`, optional `customer_purchases` |
| `giveaway` | `GiveProducts`, `StoreSuccessDialog` | `giveaways`, `inventory_transactions` (qty negative), optional `customers`, `interactions` |
| `stock_report` | `StockReportDialog`, `InstoreMorningStockCountDialog`, `InstoreClosingReportDialog` | `daily_stock_reports` (upsert by natural key) |
| `inventory_assign` | `Inventory` page | `agent_task_inventory` |

All writes are enqueued to IndexedDB first, then flushed via `sync_record_sale_batch`, `sync_record_giveaway`, `sync_daily_stock_reports`, or `sync_inventory_assign` RPCs when online.
