// [CMP-b926d6] SalesPage — supervisor sales page
import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { MobileSalesTab } from "@/components/supervisor/MobileSalesTab";
import { MobileGiveawaysTab } from "@/components/supervisor/MobileGiveawaysTab";
import { ShoppingCart, Gift } from "lucide-react";

export const SalesPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState("sales");
  
  // Date range state - you can add date pickers if needed
  const [startDate] = useState<string | null>(null);
  const [endDate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Sales & Giveaways</h1>
        <p className="text-sm opacity-90">Track sales and product distributions</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full grid grid-cols-2 p-1 m-2 max-w-[calc(100%-1rem)]">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="giveaways" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Giveaways
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="m-0">
          <MobileSalesTab 
            workspaceId={currentWorkspaceId} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </TabsContent>

        <TabsContent value="giveaways" className="m-0">
          <MobileGiveawaysTab 
            workspaceId={currentWorkspaceId} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </TabsContent>
      </Tabs>

      <SupervisorBottomNav />
    </div>
  );
};
