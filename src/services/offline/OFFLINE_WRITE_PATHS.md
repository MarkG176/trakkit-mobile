# Offline write paths

All field writes enqueue to IndexedDB first, then flush via Supabase RPCs when online.

| Operation | Service | UI entry points | Server tables / storage |
|-----------|---------|-----------------|-------------------------|
| `sale_batch` | `inventoryWriteService` | `useSalesForm`, `RecordSale`, `StoreSuccessDialog` | `interactions`, `inventory_transactions`, `agent_actions`, optional `customer_purchases` |
| `giveaway` | `inventoryWriteService` | `GiveProducts`, `StoreSuccessDialog` | `giveaways`, `inventory_transactions`, optional `customers`, `interactions` |
| `stock_report` | `inventoryWriteService` | Four stock dialogs on Reports | `daily_stock_reports` (upsert by natural key + `report_kind`) |
| `price_report` | `inventoryWriteService` | `PriceReportDialog` | `store_price_reports` |
| `inventory_assign` | `inventoryWriteService` | `Inventory` page | `agent_task_inventory` |
| `field_note` | `fieldWriteService` | Reports → Save Notes | `notes` |
| `report_images` | `fieldWriteService` | Reports → file picker / camera (`deferUpload`) | `storage:store_images` |
| `survey_response` | `surveyWriteService` | `Surveys.tsx`, `StoreSuccessDialog` | `interactions`, `survey_responses`, `agent_actions` |
| `store_create` | `storeWriteService` | Routes → Add Store | `stores`, `project_plans.target_stores` |

**Flush order:** `store_create` → `report_images` → `field_note` → stock/price → `survey_response` → sales/giveaway/inventory.

**Store aliases:** `store_create` operation id = client store id; mapped to server `stores.id` in `entityAliases` after sync. Dependent payloads reference client ids until remapped on flush.

**Attachments:** Blobs (report images, survey audio) saved in IndexedDB `attachments` store; uploaded during sync before RPC.
