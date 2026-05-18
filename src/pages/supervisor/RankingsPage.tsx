// [CMP-33afa7] RankingsPage — supervisor rankings page
import { useWorkspace } from "@/hooks/useWorkspace";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { MobileRankingsTab } from "@/components/supervisor/MobileRankingsTab";

export const RankingsPage = () => {
  const { currentWorkspaceId } = useWorkspace();

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Rankings</h1>
        <p className="text-sm opacity-90">Agent performance leaderboard</p>
      </div>

      {/* Rankings Content */}
      <div className="flex-1">
        <MobileRankingsTab workspaceId={currentWorkspaceId} />
      </div>

      <SupervisorBottomNav />
    </div>
  );
};
