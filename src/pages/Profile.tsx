import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgentProfileStats } from "@/hooks/useAgentProfileStats";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { DailySummaryCard } from "@/components/profile/DailySummaryCard";
import { WeeklySummaryCard } from "@/components/profile/WeeklySummaryCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const stats = useAgentProfileStats();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (stats.isLoading) {
    return (
      <MobileLayout currentPage="more">
        <div className="bg-primary p-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="more">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/more")}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <ArrowLeft size={20} />
        </Button>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        displayName={stats.displayName}
        currentRank={stats.currentRank}
        totalPoints={stats.totalPoints}
      />

      <div className="p-4 space-y-4 -mt-4">
        {/* Today's Summary - Main Screenshot Target */}
        <DailySummaryCard
          storesAdded={stats.todayStoresAdded}
          sales={stats.todaySales}
          revenue={stats.todayRevenue}
          surveys={stats.todaySurveys}
          giveaways={stats.todayGiveaways}
          giveawayItems={stats.todayGiveawayItems}
          workMinutes={stats.todayWorkMinutes}
        />

        {/* Weekly Summary */}
        <WeeklySummaryCard
          storesAdded={stats.weekStoresAdded}
          sales={stats.weekSales}
          revenue={stats.weekRevenue}
          surveys={stats.weekSurveys}
          giveaways={stats.weekGiveaways}
          giveawayItems={stats.weekGiveawayItems}
          workMinutes={stats.weekWorkMinutes}
        />

        {/* Profile Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Profile Details
            </h3>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{stats.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Account
            </h3>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};
