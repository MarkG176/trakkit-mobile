import { useState, useEffect, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from "@/components/supervisor/PaginationControls";
import { Package, RefreshCw, Loader2, Plus, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePagination } from "@/hooks/usePagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
}

interface AgentInventory {
  id: string;
  agentId: string;
  agentName: string;
  productVariantId: string;
  productName: string;
  amountIssued: number;
  issuedAt: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

export const InventoryManagement = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [agentInventory, setAgentInventory] = useState<AgentInventory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'products' | 'assigned'>('products');
  
  // Form state
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const filteredInventory = agentInventory.filter(item =>
    item.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ items: filteredInventory, itemsPerPage: 10 });

  const fetchData = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      setRefreshing(true);

      // Fetch product variants
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, name, sku, price')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('name');

      if (variantsError) throw variantsError;
      setProducts(variants || []);

      // Get workspace users
      const { data: workspaceUsers, error: workspaceUsersError } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      if (workspaceUsersError) throw workspaceUsersError;

      const userIds = workspaceUsers?.map(u => u.user_id) || [];
      if (userIds.length === 0) {
        setAgents([]);
        setAgentInventory([]);
        return;
      }

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', userIds)
        .eq('role', 'agent')
        .eq('is_active', true)
        .order('display_name');

      if (agentsError) throw agentsError;

      const agentIds = agentsData?.map(a => a.user_id) || [];
      const agentMap = new Map(agentsData?.map(a => [a.user_id, a]));
      
      setAgents(agentsData?.map(a => ({
        id: a.user_id,
        name: a.display_name || a.email?.split('@')[0] || 'Unknown',
        email: a.email,
      })) || []);

      let inventory: any[] = [];
      if (agentIds.length > 0) {
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('agent_task_inventory')
          .select(`
            id,
            agent_id,
            product_variant_id,
            amount_issued,
            created_at,
            name,
            product_variants (
              id,
              name
            ),
            agent_tasks!inner (
              workspace_id
            )
          `)
          .eq('is_deleted', false)
          .eq('agent_tasks.workspace_id', currentWorkspaceId)
          .in('agent_id', agentIds)
          .order('created_at', { ascending: false });

        if (inventoryError) throw inventoryError;
        inventory = inventoryData || [];
      }

      // Transform inventory data
      const transformedInventory: AgentInventory[] = (inventory || []).map(item => {
          const agent = agentMap.get(item.agent_id!);
          return {
            id: item.id,
            agentId: item.agent_id!,
            agentName: agent?.display_name || agent?.email?.split('@')[0] || 'Unknown',
            productVariantId: item.product_variant_id,
            productName: (item.product_variants as any)?.name || item.name || 'Unknown Product',
            amountIssued: item.amount_issued,
            issuedAt: item.created_at,
          };
        });

      setAgentInventory(transformedInventory);
    } catch (error: any) {
      toast({
        title: "Error loading inventory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspaceId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignInventory = async () => {
    if (!selectedAgent || !selectedProduct || !quantity || !currentWorkspaceId) {
      toast({
        title: "Missing fields",
        description: "Please select an agent, product, and enter a quantity",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      const quantityValue = parseInt(quantity, 10);
      if (Number.isNaN(quantityValue) || quantityValue <= 0) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid quantity.",
          variant: "destructive",
        });
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', selectedAgent)
        .eq('workspace_id', currentWorkspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!taskData?.id) {
        toast({
          title: "No active task",
          description: "Assign a task to the agent before issuing inventory.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.rpc('issue_stock_to_agent', {
        agent_id: selectedAgent,
        product_variant_id: selectedProduct,
        quantity: quantityValue,
        task_id: taskData.id,
      });

      if (error) throw error;

      toast({
        title: "Inventory Assigned",
        description: `${quantity} units assigned successfully`,
      });

      setAssignDialogOpen(false);
      setSelectedAgent("");
      setSelectedProduct("");
      setQuantity("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error assigning inventory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <SupervisorMobileLayout currentPage="inventory">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="inventory">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm opacity-90">Manage product assignments</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchData}
              disabled={refreshing}
              className="text-primary-foreground hover:bg-white/20"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="icon"
              onClick={() => setAssignDialogOpen(true)}
              className="bg-white/20 hover:bg-white/30"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {products.length} products
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {agentInventory.length} assignments
          </Badge>
        </div>
      </div>

      <div className="p-4 pb-24">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3">
            {products.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No products found</p>
              </Card>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                    {product.price && (
                      <Badge variant="secondary">
                        KES {product.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {paginatedItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No inventory assigned</p>
              </Card>
            ) : (
              <>
                {paginatedItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {item.agentName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">{item.agentName}</h3>
                          <Badge>{item.amountIssued} units</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned: {new Date(item.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={totalItems}
                  onPrevPage={prevPage}
                  onNextPage={nextPage}
                  hasPrevPage={hasPrevPage}
                  hasNextPage={hasNextPage}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Inventory Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Assign Inventory
            </DialogTitle>
            <DialogDescription>
              Assign products to an agent's inventory
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {product.name}
                        {product.sku && <span className="text-xs text-muted-foreground">({product.sku})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignInventory} disabled={assigning}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
