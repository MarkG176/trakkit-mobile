import { useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { workspaceService } from '@/services/workspaceService';
import { submitSaleBatch } from '@/services/inventoryWriteService';
import type { SaleBatchPayload } from '@/services/offline/types';
import { useSync } from './useSync';

interface SaleItem {
  productVariantId: string;
  quantity: number;
  price: number;
  lineTotal?: number;
}

interface SaleFormData {
  items: SaleItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  engagementType: string;
  notes: string;
  sentiment: number;
  imageUrl?: string;
  customerId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  projectId?: string | null;
}

export const useSalesForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshCounts } = useSync();

  const submitSale = async (formData: SaleFormData) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to record sales",
        variant: "destructive",
      });
      return false;
    }

    const workspaceId = workspaceService.getCurrentWorkspaceId();
    if (!workspaceId) {
      toast({
        title: "Workspace Required",
        description: "Please select a workspace first",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      const payload: SaleBatchPayload = {
        items: formData.items,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        engagementType: formData.engagementType,
        notes: formData.notes,
        sentiment: formData.sentiment,
        imageUrl: formData.imageUrl,
        customerId: formData.customerId,
        latitude: formData.latitude,
        longitude: formData.longitude,
        projectId: formData.projectId ?? workspaceService.getCurrentProjectId(),
      };

      const result = await submitSaleBatch({
        workspaceId,
        agentId: user.id,
        payload,
      });

      await refreshCounts();

      const totalValue = formData.items.reduce(
        (sum, item) => sum + (item.lineTotal ?? item.price * item.quantity),
        0
      );
      const pointsEarned = Math.max(Math.floor(totalValue / 10) * 5, 25);

      toast({
        title: result.queued ? "Sale saved on device" : "Sale recorded successfully!",
        description: result.queued
          ? result.message
          : `+${pointsEarned} points will apply after sync. Engagement logged.`,
      });

      return true;
    } catch (error) {
      console.error('Error submitting sale:', error);
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitSale, loading };
};
