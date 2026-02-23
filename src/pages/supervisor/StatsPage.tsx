import { useWorkspace } from "@/hooks/useWorkspace";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { MobileSalesTab } from "@/components/supervisor/MobileSalesTab";
import { MobileRankingsTab } from "@/components/supervisor/MobileRankingsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const StatsPage = () => {
  const { currentWorkspaceId } = useWorkspace();

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Stats</h1>
        <p className="text-sm opacity-90">Sales & agent performance</p>
      </div>

      <Tabs defaultValue="sales" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="sales" className="flex-1">Sales</TabsTrigger>
          <TabsTrigger value="rankings" className="flex-1">Rankings</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="flex-1 mt-0">
          <MobileSalesTab workspaceId={currentWorkspaceId} startDate={null} endDate={null} />
        </TabsContent>
        <TabsContent value="rankings" className="flex-1 mt-0">
          <MobileRankingsTab workspaceId={currentWorkspaceId} />
        </TabsContent>
      </Tabs>

      <SupervisorBottomNav />
    </div>
  );
};
