import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, LogOut, MapPin, Clock, ShoppingCart, FileText, MessageSquare, CheckCircle, Store, ListTodo, Trophy, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAgentProfileStats } from "@/hooks/useAgentProfileStats";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { useLanguage } from "@/hooks/useLanguage";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatWorkTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const formatCurrency = (amount: number) => {
  return `KES ${amount.toLocaleString()}`;
};

const MetricRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: React.ElementType }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
    {children}
  </h2>
);

export const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentTeamType, isInitialized, isLoading: isWorkspaceLoading } = useWorkspace();
  const { t } = useLanguage();
  const stats = useAgentProfileStats();
  const isWholesale = currentTeamType?.toLowerCase() === 'wholesale';
  const isSeeding = currentTeamType?.toLowerCase() === 'seeding';
  const isInstore = currentTeamType?.toLowerCase() === 'instore';
  const isSurvey = ['survey', 'survey_campaign'].includes(currentTeamType?.toLowerCase() ?? '');

  if (!isInitialized || isWorkspaceLoading) {
    return (
      <MobileLayout currentPage="profile">
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (stats.isLoading) {
    return (
      <MobileLayout currentPage="profile">
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
    <MobileLayout currentPage="profile">

      <ProfileHeader
        displayName={stats.displayName}
        currentRank={stats.currentRank}
        totalPoints={stats.totalPoints}
        teamType={currentTeamType || undefined}
      />

      <div className="p-4 space-y-4 -mt-4">
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1">{t("today")}</TabsTrigger>
            <TabsTrigger value="alltime" className="flex-1">{t("all_time")}</TabsTrigger>
          </TabsList>

          {/* TODAY TAB */}
          <TabsContent value="today" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground">{todayDate}</p>

            {/* Activity & Attendance */}
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Activity & Attendance</SectionTitle>
                {!isWholesale && !isSeeding && !isInstore && !isSurvey && <MetricRow label="Store Visits" value={stats.todayStoreVisits} icon={Store} />}
                <MetricRow label="Check-ins" value={stats.todayCheckIns} icon={CheckCircle} />
                <MetricRow label="Work Time" value={formatWorkTime(stats.todayWorkMinutes)} icon={Clock} />
                {isSeeding && <MetricRow label="Stores Added" value={stats.todayStoresAdded} icon={MapPin} />}
              </CardContent>
            </Card>

            {/* Tasks - hide for wholesale, seeding, instore, and survey */}
            {!isWholesale && !isSeeding && !isInstore && !isSurvey && (
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Tasks</SectionTitle>
                  <MetricRow label="Total Tasks" value={stats.todayTotalTasks} icon={ListTodo} />
                  <MetricRow label="Completed" value={stats.todayCompletedTasks} icon={CheckCircle} />
                  <MetricRow label="Pending" value={stats.todayPendingTasks} icon={Clock} />
                </CardContent>
              </Card>
            )}

            {/* Sales & Revenue - hide for survey */}
            {!isSurvey && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Sales & Revenue</SectionTitle>
                {isWholesale ? (
                  <>
                    <MetricRow label="Products Sold" value={stats.todayWholesaleSales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.todayWholesaleRevenue)} icon={ShoppingCart} />
                  </>
                ) : isSeeding ? (
                  <>
                    <MetricRow label="Sales Made" value={stats.todaySales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.todayRevenue)} icon={ShoppingCart} />
                    <MetricRow label="Giveaways" value={stats.todayGiveaways} icon={Star} />
                  </>
                ) : (
                  <>
                    <MetricRow label="Sales Made" value={stats.todaySales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.todayRevenue)} icon={ShoppingCart} />
                    <MetricRow label="Stores Added" value={stats.todayStoresAdded} icon={MapPin} />
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {/* Engagement - hide for instore */}
            {!isInstore && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Engagement</SectionTitle>
                {(!isWholesale || isSeeding) && !isSurvey && <MetricRow label="Interactions" value={stats.todayInteractionsCount} icon={MessageSquare} />}
                {(!isWholesale || stats.hasSurveyAssigned || isSeeding || isSurvey) && (
                  <MetricRow label="Surveys Done" value={stats.todaySurveys} icon={FileText} />
                )}
                {!isSeeding && !isSurvey && <MetricRow label="Giveaways" value={stats.todayGiveaways} icon={Star} />}
                {!isWholesale && !isSeeding && !isSurvey && <MetricRow label="Items Given" value={stats.todayGiveawayItems} icon={Star} />}
                {!isSeeding && !isSurvey && <MetricRow label="Notes" value={stats.todayNotesCount} icon={FileText} />}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* ALL TIME TAB */}
          <TabsContent value="alltime" className="space-y-4 mt-4">
            {/* Activity & Attendance */}
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Activity & Attendance</SectionTitle>
                {!isWholesale && !isSeeding && !isInstore && !isSurvey && <MetricRow label="Store Visits" value={stats.allTimeStoreVisits} icon={Store} />}
                <MetricRow label="Check-ins" value={stats.allTimeCheckIns} icon={CheckCircle} />
                {isSeeding && <MetricRow label="Stores Added" value={stats.allTimeStoresAdded} icon={MapPin} />}
              </CardContent>
            </Card>

            {/* Sales & Revenue - hide for survey */}
            {!isSurvey && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Sales & Revenue</SectionTitle>
                {isWholesale ? (
                  <>
                    <MetricRow label="Products Sold" value={stats.allTimeWholesaleSales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.allTimeWholesaleRevenue)} icon={ShoppingCart} />
                  </>
                ) : isSeeding ? (
                  <>
                    <MetricRow label="Sales Made" value={stats.allTimeSales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.allTimeRevenue)} icon={ShoppingCart} />
                    <MetricRow label="Giveaways" value={stats.allTimeGiveaways} icon={Star} />
                  </>
                ) : (
                  <>
                    <MetricRow label="Sales Made" value={stats.allTimeSales} icon={ShoppingCart} />
                    <MetricRow label="Revenue" value={formatCurrency(stats.allTimeRevenue)} icon={ShoppingCart} />
                    <MetricRow label="Stores Added" value={stats.allTimeStoresAdded} icon={MapPin} />
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {/* Engagement - hide for instore */}
            {!isInstore && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>Engagement</SectionTitle>
                {(!isWholesale || isSeeding) && !isSurvey && <MetricRow label="Interactions" value={stats.allTimeInteractionsCount} icon={MessageSquare} />}
                {(!isWholesale || stats.hasSurveyAssigned || isSeeding || isSurvey) && (
                  <MetricRow label="Surveys Done" value={stats.allTimeSurveys} icon={FileText} />
                )}
                {!isSeeding && !isSurvey && <MetricRow label="Giveaways" value={stats.allTimeGiveaways} icon={Star} />}
                {!isWholesale && !isSeeding && !isSurvey && <MetricRow label="Items Given" value={stats.allTimeGiveawayItems} icon={Star} />}
                {!isSeeding && !isSurvey && <MetricRow label="Notes" value={stats.allTimeNotesCount} icon={FileText} />}
              </CardContent>
            </Card>
            )}

            {/* Points - hide for wholesale, seeding, instore, and survey */}
            {!isWholesale && !isSeeding && !isInstore && !isSurvey && (
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Points & Rank</SectionTitle>
                  <MetricRow label="Rank" value={stats.currentRank} icon={Trophy} />
                  <MetricRow label="Total Points" value={stats.totalPoints} icon={Star} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>

        {/* Account Card - always visible */}
        <Card>
          <CardContent className="p-4">
            <SectionTitle>Account</SectionTitle>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground text-sm">{stats.email}</span>
            </div>
            
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 mt-2"
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
