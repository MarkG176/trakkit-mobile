import { supabase } from '@/integrations/supabase/client';
import { workspaceService } from '@/services/workspaceService';
import { logActivity, logFailedActivity } from '@/utils/activityLogger';
import { reverseGeocode } from '@/utils/googleMapsGeocoding';
import { saveEntityAlias } from './entityAliasStore';
import { getAttachment, deleteAttachment } from './attachmentStore';
import type {
  FieldNotePayload,
  GiveawayPayload,
  InventoryAssignPayload,
  OutboxItem,
  PriceReportPayload,
  ReportImagesPayload,
  SaleBatchPayload,
  StockReportPayload,
  StoreCreatePayload,
  SurveyResponsePayload,
} from './types';

const MAX_ATTEMPTS = 5;

const getSaleLineTotal = (item: { price: number; quantity: number; lineTotal?: number }) =>
  item.lineTotal ?? item.price * item.quantity;

function isRpcMissing(error: unknown): boolean {
  const msg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : String(error);
  return (
    msg.includes('Could not find the function') ||
    msg.includes('schema cache') ||
    msg.includes('42883')
  );
}

export async function syncOutboxItem(item: OutboxItem): Promise<void> {
  switch (item.type) {
    case 'store_create':
      await syncStoreCreate(item);
      break;
    case 'report_images':
      await syncReportImages(item);
      break;
    case 'field_note':
      await syncFieldNote(item);
      break;
    case 'sale_batch':
      await syncSaleBatch(item);
      break;
    case 'giveaway':
      await syncGiveaway(item);
      break;
    case 'stock_report':
      await syncStockReport(item);
      break;
    case 'price_report':
      await syncPriceReport(item);
      break;
    case 'inventory_assign':
      await syncInventoryAssign(item);
      break;
    case 'survey_response':
      await syncSurveyResponse(item);
      break;
    default:
      throw new Error(`Unknown outbox type: ${(item as OutboxItem).type}`);
  }
}

async function uploadAttachmentToStorage(
  attachmentId: string,
  bucket: string,
  folder: string
): Promise<string> {
  const record = await getAttachment(attachmentId);
  if (!record) throw new Error(`Attachment ${attachmentId} not found`);

  const filePath = `${folder}/${record.fileName}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, record.blob, {
    contentType: record.mimeType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  await deleteAttachment(attachmentId);
  return data.publicUrl;
}

async function syncSaleBatch(item: OutboxItem): Promise<void> {
  const payload = item.payload as SaleBatchPayload;
  const { data, error } = await supabase.rpc('sync_record_sale_batch', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Sale sync rejected');
    }
    logActivity({
      action: 'sale_recorded',
      category: 'sales',
      details: { clientOperationId: item.id, itemsCount: payload.items.length },
      workspaceId: item.workspaceId,
    });
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncSaleBatchLegacy(item);
}

async function syncSaleBatchLegacy(item: OutboxItem): Promise<void> {
  const payload = item.payload as SaleBatchPayload;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { data: existingOp, error: existingOpError } = await supabase
    .from('client_sync_operations')
    .select('id')
    .eq('id', item.id)
    .maybeSingle();

  if (existingOp) return;
  if (existingOpError && !isRpcMissing(existingOpError)) {
    console.warn('[sync] client_sync_operations check:', existingOpError.message);
  }

  let taskId = payload.taskId ?? null;
  if (!taskId) {
    const { data: currentTask } = await supabase
      .from('agent_tasks')
      .select('id')
      .eq('agent_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    taskId = currentTask?.id ?? null;
  }

  const totalValue = payload.items.reduce((sum, i) => sum + getSaleLineTotal(i), 0);

  for (const line of payload.items) {
    const lineTotal = getSaleLineTotal(line);
    const { error: interactionError } = await supabase.from('interactions').insert({
      task_id: taskId,
      agent_id: user.id,
      interaction_type: 'sale',
      customer_name: payload.customerName ?? payload.storeName,
      customer_phone: payload.customerPhone,
      product_variant_id: line.productVariantId,
      quantity_sold: line.quantity,
      sale_value: lineTotal,
      outcome: payload.storeId ? 'completed' : 'sale',
      workspace_id: item.workspaceId,
      store_id: payload.storeId ?? null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: new Date().toISOString(),
      image_url: payload.imageUrl ?? null,
      metadata: {
        engagement_type: payload.engagementType,
        notes: payload.notes,
        sentiment: payload.sentiment,
        customer_email: payload.customerEmail,
        client_operation_id: item.id,
      },
    } as Record<string, unknown>);
    if (interactionError) throw interactionError;

    const { error: invError } = await supabase.from('inventory_transactions').insert(
      workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        product_id: line.productVariantId,
        qty: -line.quantity,
        type: 'sale',
        reference: `Sale to ${payload.customerName || payload.storeName || 'Customer'}`,
        metadata: { task_id: taskId, sale_value: lineTotal, line_product_id: line.productVariantId, client_operation_id: item.id },
      })
    );
    if (invError) throw invError;
  }

  if (payload.customerId) {
    for (const line of payload.items) {
      await supabase.from('customer_purchases').insert({
        customer_id: payload.customerId,
        agent_id: user.id,
        product_variant_id: line.productVariantId,
        quantity: line.quantity,
        total_value: getSaleLineTotal(line),
        location_lat: payload.latitude,
        location_lng: payload.longitude,
        workspace_id: item.workspaceId,
        project_id: payload.projectId,
      } as Record<string, unknown>);
    }
  } else if (payload.includeCustomerPurchase && payload.storeName) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          name: payload.storeName,
          county: payload.storeCounty,
          location_lat: payload.latitude,
          location_lng: payload.longitude,
        },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select()
      .single();
    if (!customerError && customer) {
      for (const line of payload.items) {
        await supabase.from('customer_purchases').insert({
          customer_id: customer.id,
          agent_id: user.id,
          product_variant_id: line.productVariantId,
          quantity: line.quantity,
          total_value: getSaleLineTotal(line),
          location_lat: payload.latitude,
          location_lng: payload.longitude,
          workspace_id: item.workspaceId,
          project_id: payload.projectId,
        } as Record<string, unknown>);
      }
    }
  }

  const pointsEarned = Math.floor(totalValue / 10) * 5;
  await supabase.from('agent_actions').insert(
    workspaceService.ensureWorkspaceContext({
      agent_id: user.id,
      action_type: 'sale_recorded',
      points_earned: Math.max(pointsEarned, 25),
      action_data: {
        total_value: totalValue,
        customer_name: payload.customerName,
        items_count: payload.items.length,
        client_operation_id: item.id,
      },
    })
  );
}

async function syncGiveaway(item: OutboxItem): Promise<void> {
  const payload = item.payload as GiveawayPayload;
  const { data, error } = await supabase.rpc('sync_record_giveaway', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Giveaway sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncGiveawayLegacy(item);
}

async function syncGiveawayLegacy(item: OutboxItem): Promise<void> {
  const payload = item.payload as GiveawayPayload;
  const { data: existingOp } = await supabase
    .from('client_sync_operations')
    .select('id')
    .eq('id', item.id)
    .maybeSingle();
  if (existingOp) return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('giveaways').insert({
    agent_id: user.id,
    products_given: payload.productsGiven,
    total_items: payload.totalItems,
    recipient_name: payload.recipientName,
    recipient_phone: payload.recipientPhone,
    notes: payload.notes,
    location_lat: payload.locationLat,
    location_lng: payload.locationLng,
    workspace_id: item.workspaceId,
    project_id: payload.projectId,
    store_id: payload.storeId,
    recorded_at: payload.recordedAt ?? new Date().toISOString(),
  });
  if (error) throw error;

  for (const p of payload.productsGiven) {
    await supabase.from('inventory_transactions').insert(
      workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        product_id: p.product_variant_id,
        qty: -p.quantity,
        type: 'giveaway',
        reference: `Giveaway to ${payload.recipientName || 'Recipient'}`,
        metadata: { product_variant_id: p.product_variant_id, client_operation_id: item.id },
      })
    );
  }

  if (payload.saveCustomer) {
    const customerData = {
      name: payload.saveCustomer.name,
      phone: payload.saveCustomer.phone ?? null,
      location_lat: payload.saveCustomer.location_lat,
      location_lng: payload.saveCustomer.location_lng,
      workspace_id: item.workspaceId,
    };
    if (payload.saveCustomer.phone) {
      await supabase.from('customers').upsert(customerData, { onConflict: 'phone' });
    } else {
      await supabase.from('customers').insert(customerData);
    }
  }

  if (payload.logInteraction) {
    await supabase.from('interactions').insert({
      agent_id: user.id,
      interaction_type: 'other',
      customer_name: payload.logInteraction.customerName,
      customer_phone: payload.logInteraction.customerPhone,
      outcome: 'completed',
      quantity_sold: 0,
      workspace_id: item.workspaceId,
      metadata: {
        interaction_type: payload.logInteraction.interactionType,
        client_operation_id: item.id,
        notes: payload.logInteraction.notes,
        sentiment: payload.logInteraction.sentiment,
      },
    });
  }
}

async function syncStockReport(item: OutboxItem): Promise<void> {
  const payload = item.payload as StockReportPayload;
  const { data, error } = await supabase.rpc('sync_daily_stock_reports', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Stock report sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncStockReportLegacy(item);
}

async function syncStockReportLegacy(item: OutboxItem): Promise<void> {
  const payload = item.payload as StockReportPayload;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const reports = payload.rows.map((row) => ({
    agent_id: user.id,
    product_variant_id: row.product_variant_id,
    stock_level: row.stock_level ?? null,
    opening_stock: row.opening_stock ?? null,
    quantity_sold: row.quantity_sold ?? null,
    closing_stock: row.closing_stock ?? null,
    report_type: payload.reportType,
    report_kind: payload.reportKind ?? 'availability',
    work_date: payload.workDate,
    workspace_id: item.workspaceId,
    store_id: payload.storeId ?? null,
  }));

  const { error } = await supabase.from('daily_stock_reports').insert(reports);
  if (error) throw error;
}

async function syncInventoryAssign(item: OutboxItem): Promise<void> {
  const payload = item.payload as InventoryAssignPayload;
  const { data, error } = await supabase.rpc('sync_inventory_assign', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Inventory assign sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncInventoryAssignLegacy(item);
}

async function syncInventoryAssignLegacy(item: OutboxItem): Promise<void> {
  const payload = item.payload as InventoryAssignPayload;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { data: existingOp } = await supabase
    .from('client_sync_operations')
    .select('id')
    .eq('id', item.id)
    .maybeSingle();
  if (existingOp) return;

  const inserts = payload.entries.map((e) => ({
    agent_id: user.id,
    product_variant_id: e.productVariantId,
    amount_issued: e.quantity,
    name: e.name ?? null,
  }));

  const { error } = await supabase.from('agent_task_inventory').insert(inserts);
  if (error) throw error;
}

async function syncStoreCreate(item: OutboxItem): Promise<void> {
  const payload = item.payload as StoreCreatePayload;
  let county = payload.county ?? '';
  let country = payload.country ?? '';

  if ((!county || !country) && payload.latitude && payload.longitude) {
    try {
      const geo = await reverseGeocode(payload.latitude, payload.longitude);
      county = geo.county;
      country = geo.country;
    } catch (e) {
      console.warn('[sync] Geocode failed for store create:', e);
    }
  }

  const syncPayload = { ...payload, county, country };
  const { data, error } = await supabase.rpc('sync_create_store', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: syncPayload as any,
  });

  if (error) {
    if (!isRpcMissing(error)) throw error;
    await syncStoreCreateLegacy(item, county, country);
    return;
  }

  if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
    throw new Error((data as { error?: string }).error || 'Store create rejected');
  }

  const storeId = (data as { store_id?: string })?.store_id;
  if (storeId) {
    await saveEntityAlias(item.id, storeId, 'store');
  }
}

async function syncStoreCreateLegacy(
  item: OutboxItem,
  county: string,
  country: string
): Promise<void> {
  const payload = item.payload as StoreCreatePayload;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('stores')
    .select('id')
    .eq('client_operation_id', item.id)
    .maybeSingle();
  if (existing) {
    await saveEntityAlias(item.id, existing.id, 'store');
    return;
  }

  const { data: inserted, error } = await supabase
    .from('stores')
    .insert({
      store_name: payload.storeName,
      county: county || null,
      store_lat: payload.latitude,
      store_long: payload.longitude,
      contact: payload.contact ?? null,
      added_by: user.id,
      workspace_id: item.workspaceId,
      country: country || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (inserted) await saveEntityAlias(item.id, inserted.id, 'store');
}

async function syncReportImages(item: OutboxItem): Promise<void> {
  const payload = item.payload as ReportImagesPayload;
  for (const attachmentId of payload.attachmentIds) {
    await uploadAttachmentToStorage(attachmentId, payload.bucket, payload.folder);
  }
}

async function syncFieldNote(item: OutboxItem): Promise<void> {
  const payload = item.payload as FieldNotePayload;
  const { data, error } = await supabase.rpc('sync_field_note', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Note sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { error: insertError } = await supabase.from('notes').insert({
    agent_id: user.id,
    workspace_id: item.workspaceId,
    content: payload.content,
    note_type: payload.noteType ?? 'field',
  });
  if (insertError) throw insertError;
}

async function syncPriceReport(item: OutboxItem): Promise<void> {
  const payload = item.payload as PriceReportPayload;
  const { data, error } = await supabase.rpc('sync_store_price_reports', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Price report sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncPriceReportLegacy(item);
}

async function syncPriceReportLegacy(item: OutboxItem): Promise<void> {
  const payload = item.payload as PriceReportPayload;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const rows = payload.rows.map((row) => ({
    agent_id: user.id,
    store_id: payload.storeId ?? null,
    product_variant_id: row.product_variant_id,
    price: row.price,
    stock_level: row.stock_level ?? null,
    work_date: payload.workDate,
    workspace_id: item.workspaceId,
  }));

  const { error } = await supabase.from('store_price_reports' as 'giveaways').insert(rows as never);
  if (error) throw error;
}

async function syncSurveyResponse(item: OutboxItem): Promise<void> {
  const payload = { ...(item.payload as SurveyResponsePayload) };

  if (payload.audioAttachmentId && !payload.audioUrl) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error('Not authenticated');
    payload.audioUrl = await uploadAttachmentToStorage(
      payload.audioAttachmentId,
      'sale-recordings',
      user.id
    );
  }

  const { data, error } = await supabase.rpc('sync_record_survey', {
    p_client_operation_id: item.id,
    p_workspace_id: item.workspaceId,
    p_payload: payload as any,
  });

  if (!error) {
    if (data && typeof data === 'object' && (data as { success?: boolean }).success === false) {
      throw new Error((data as { error?: string }).error || 'Survey sync rejected');
    }
    return;
  }

  if (!isRpcMissing(error)) throw error;
  await syncSurveyResponseLegacy(item, payload);
}

async function syncSurveyResponseLegacy(
  item: OutboxItem,
  payload: SurveyResponsePayload
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not authenticated');

  const { data: interaction, error: interactionError } = await supabase
    .from('interactions')
    .insert({
      task_id: payload.taskId ?? null,
      agent_id: user.id,
      interaction_type: 'survey',
      outcome: 'completed',
      quantity_sold: 0,
      workspace_id: item.workspaceId,
      store_id: payload.storeId ?? null,
      customer_name: payload.storeName,
      latitude: payload.locationLat,
      longitude: payload.locationLng,
      metadata: {
        survey_template_id: payload.surveyTemplateId,
        recordingUrl: payload.audioUrl,
      },
    })
    .select()
    .single();
  if (interactionError) throw interactionError;

  const { error: surveyError } = await supabase.from('survey_responses').insert({
    agent_id: user.id,
    survey_template_id: payload.surveyTemplateId,
    interaction_id: interaction.id,
    responses: payload.responses,
    started_at: payload.startedAt,
    completed_at: payload.completedAt,
    duration_seconds: payload.durationSeconds,
    completion_time_seconds: payload.durationSeconds,
    is_completed: true,
    completion_status: 'completed',
    location_lat: payload.locationLat,
    location_lng: payload.locationLng,
    workspace_id: item.workspaceId,
  });
  if (surveyError) throw surveyError;

  await supabase.from('agent_actions').insert(
    workspaceService.ensureWorkspaceContext({
      agent_id: user.id,
      action_type: 'survey_completed',
      points_earned: payload.points ?? 20,
      action_data: {
        survey_type: payload.surveyName,
        survey_template_id: payload.surveyTemplateId,
        interaction_id: interaction.id,
      },
    })
  );
}

export function classifySyncError(error: unknown): 'blocked' | 'failed' {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : String(error);
  if (
    msg.toLowerCase().includes('insufficient') ||
    msg.toLowerCase().includes('stock') ||
    msg.toLowerCase().includes('available')
  ) {
    return 'blocked';
  }
  return 'failed';
}

export { MAX_ATTEMPTS };
