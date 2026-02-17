import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgentProfileStats } from "@/hooks/useAgentProfileStats";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Skeleton } from "@/components/ui/skeleton";

const formatWorkTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const formatCurrency = (amount: number) => {
  return `KES ${amount.toLocaleString()}`;
};

const MetricRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

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
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </MobileLayout>
    );
  }

  const todayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

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

      <ProfileHeader
        displayName={stats.displayName}
        currentRank={stats.currentRank}
        totalPoints={stats.totalPoints}
      />

      <div className="p-4 space-y-4 -mt-4">
        {/* Today's Metrics */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Today's Summary
            </h2>
            <p className="text-xs text-muted-foreground mb-3">{todayDate}</p>
            <div>
              <MetricRow label="Stores Added" value={stats.todayStoresAdded} />
              <MetricRow label="Sales Made" value={stats.todaySales} />
              <MetricRow label="Revenue" value={formatCurrency(stats.todayRevenue)} />
              <MetricRow label="Surveys Done" value={stats.todaySurveys} />
              <MetricRow label="Giveaways" value={stats.todayGiveaways} />
              <MetricRow label="Items Given" value={stats.todayGiveawayItems} />
              <MetricRow label="Work Time" value={formatWorkTime(stats.todayWorkMinutes)} />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Metrics */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              This Week
            </h2>
            <div>
              <MetricRow label="Stores Added" value={stats.weekStoresAdded} />
              <MetricRow label="Sales Made" value={stats.weekSales} />
              <MetricRow label="Revenue" value={formatCurrency(stats.weekRevenue)} />
              <MetricRow label="Surveys Done" value={stats.weekSurveys} />
              <MetricRow label="Giveaways" value={stats.weekGiveaways} />
              <MetricRow label="Items Given" value={stats.weekGiveawayItems} />
              <MetricRow label="Work Time" value={formatWorkTime(stats.weekWorkMinutes)} />
            </div>
          </CardContent>
        </Card>

        {/* Profile & Account */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Account
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground text-sm">{stats.email}</span>
            </div>
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
