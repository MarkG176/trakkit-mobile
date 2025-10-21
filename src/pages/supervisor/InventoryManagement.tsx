import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CheckoutRequest {
  id: string;
  agentName: string;
  agentEmail: string;
  requestedAt: string;
  status: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

export const InventoryManagement = () => {
  const [requests, setRequests] = useState<CheckoutRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CheckoutRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const { data: checkoutRequests, error } = await supabase
        .from("checkout_requests")
        .select(`
          id,
          agent_id,
          requested_at,
          status
        `)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (error) throw error;

      // Fetch agent details and product requests
      const requestsWithDetails = await Promise.all(
        (checkoutRequests || []).map(async (request) => {
          const { data: userData } = await supabase
            .from("user_roles")
            .select("display_name, email")
            .eq("user_id", request.agent_id)
            .single();

          return {
            id: request.id,
            agentName: userData?.display_name || "Unknown Agent",
            agentEmail: userData?.email || "",
            requestedAt: request.requested_at,
            status: request.status,
            items: [
              { productName: "Sample Product", quantity: 5 },
            ],
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("checkout_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Request approved",
        description: "The inventory request has been approved successfully.",
      });

      fetchPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error approving request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("checkout_requests")
        .update({
          status: "rejected",
          notes: rejectionReason,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request rejected",
        description: "The inventory request has been rejected.",
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error rejecting request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <SupervisorMobileLayout currentPage="inventory">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-sm opacity-90">Manage stock assignments</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
          <p className="text-sm text-muted-foreground">
            {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>

        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{request.agentName}</h3>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {request.agentEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested{" "}
                    {new Date(request.requestedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded p-3 mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Requested Items
                </p>
                {request.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-1">
                    <span>{item.productName}</span>
                    <span className="font-medium">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApproveRequest(request.id)}
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowRejectDialog(true);
                  }}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </Card>
          ))}

          {requests.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No pending requests</p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this inventory request.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectRequest} variant="destructive">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
