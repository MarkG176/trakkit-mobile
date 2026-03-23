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
  const isSeeding = ['seeding', 'market_research'].includes(currentTeamType?.toLowerCase() ?? '');
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
                <SectionTitle>{t("activity_attendance")}</SectionTitle>
                {!isWholesale && !isSeeding && !isInstore && !isSurvey && <MetricRow label={t("store_visits")} value={stats.todayStoreVisits} icon={Store} />}
                <MetricRow label={t("check_ins")} value={stats.todayCheckIns} icon={CheckCircle} />
                <MetricRow label={t("work_time")} value={formatWorkTime(stats.todayWorkMinutes)} icon={Clock} />
                {isSeeding && <MetricRow label={t("stores_added")} value={stats.todayStoresAdded} icon={MapPin} />}
              </CardContent>
            </Card>

            {/* Tasks - hide for wholesale, seeding, instore, and survey */}
            {!isWholesale && !isSeeding && !isInstore && !isSurvey && (
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>{t("tasks")}</SectionTitle>
                  <MetricRow label={t("total_tasks")} value={stats.todayTotalTasks} icon={ListTodo} />
                  <MetricRow label={t("completed")} value={stats.todayCompletedTasks} icon={CheckCircle} />
                  <MetricRow label={t("pending")} value={stats.todayPendingTasks} icon={Clock} />
                </CardContent>
              </Card>
            )}

            {/* Sales & Revenue - hide for survey */}
            {!isSurvey && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>{t("sales_revenue")}</SectionTitle>
                {isWholesale ? (
                  <>
                    <MetricRow label={t("products_sold")} value={stats.todayWholesaleSales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.todayWholesaleRevenue)} icon={ShoppingCart} />
                  </>
                ) : isSeeding ? (
                  <>
                    <MetricRow label={t("sales_made")} value={stats.todaySales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.todayRevenue)} icon={ShoppingCart} />
                    <MetricRow label={t("giveaways")} value={stats.todayGiveaways} icon={Star} />
                  </>
                ) : (
                  <>
                    <MetricRow label={t("sales_made")} value={stats.todaySales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.todayRevenue)} icon={ShoppingCart} />
                    <MetricRow label={t("stores_added")} value={stats.todayStoresAdded} icon={MapPin} />
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {/* Engagement - hide for instore */}
            {!isInstore && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>{t("engagement")}</SectionTitle>
                {(!isWholesale || isSeeding) && !isSurvey && <MetricRow label={t("interactions")} value={stats.todayInteractionsCount} icon={MessageSquare} />}
                {(!isWholesale || stats.hasSurveyAssigned || isSeeding || isSurvey) && (
                  <MetricRow label={t("surveys_done")} value={stats.todaySurveys} icon={FileText} />
                )}
                {!isSeeding && !isSurvey && <MetricRow label={t("giveaways")} value={stats.todayGiveaways} icon={Star} />}
                {!isWholesale && !isSeeding && !isSurvey && <MetricRow label={t("items_given")} value={stats.todayGiveawayItems} icon={Star} />}
                {!isSeeding && !isSurvey && <MetricRow label={t("notes")} value={stats.todayNotesCount} icon={FileText} />}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* ALL TIME TAB */}
          <TabsContent value="alltime" className="space-y-4 mt-4">
            {/* Activity & Attendance */}
            <Card>
              <CardContent className="p-4">
                <SectionTitle>{t("activity_attendance")}</SectionTitle>
                {!isWholesale && !isSeeding && !isInstore && !isSurvey && <MetricRow label={t("store_visits")} value={stats.allTimeStoreVisits} icon={Store} />}
                <MetricRow label={t("check_ins")} value={stats.allTimeCheckIns} icon={CheckCircle} />
                {isSeeding && <MetricRow label={t("stores_added")} value={stats.allTimeStoresAdded} icon={MapPin} />}
              </CardContent>
            </Card>

            {/* Sales & Revenue - hide for survey */}
            {!isSurvey && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>{t("sales_revenue")}</SectionTitle>
                {isWholesale ? (
                  <>
                    <MetricRow label={t("products_sold")} value={stats.allTimeWholesaleSales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.allTimeWholesaleRevenue)} icon={ShoppingCart} />
                  </>
                ) : isSeeding ? (
                  <>
                    <MetricRow label={t("sales_made")} value={stats.allTimeSales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.allTimeRevenue)} icon={ShoppingCart} />
                    <MetricRow label={t("giveaways")} value={stats.allTimeGiveaways} icon={Star} />
                  </>
                ) : (
                  <>
                    <MetricRow label={t("sales_made")} value={stats.allTimeSales} icon={ShoppingCart} />
                    <MetricRow label={t("revenue")} value={formatCurrency(stats.allTimeRevenue)} icon={ShoppingCart} />
                    <MetricRow label={t("stores_added")} value={stats.allTimeStoresAdded} icon={MapPin} />
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {/* Engagement - hide for instore */}
            {!isInstore && (
            <Card>
              <CardContent className="p-4">
                <SectionTitle>{t("engagement")}</SectionTitle>
                {(!isWholesale || isSeeding) && !isSurvey && <MetricRow label={t("interactions")} value={stats.allTimeInteractionsCount} icon={MessageSquare} />}
                {(!isWholesale || stats.hasSurveyAssigned || isSeeding || isSurvey) && (
                  <MetricRow label={t("surveys_done")} value={stats.allTimeSurveys} icon={FileText} />
                )}
                {!isSeeding && !isSurvey && <MetricRow label={t("giveaways")} value={stats.allTimeGiveaways} icon={Star} />}
                {!isWholesale && !isSeeding && !isSurvey && <MetricRow label={t("items_given")} value={stats.allTimeGiveawayItems} icon={Star} />}
                {!isSeeding && !isSurvey && <MetricRow label={t("notes")} value={stats.allTimeNotesCount} icon={FileText} />}
              </CardContent>
            </Card>
            )}

            {/* Points - hide for wholesale, seeding, instore, and survey */}
            {!isWholesale && !isSeeding && !isInstore && !isSurvey && (
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>{t("points_rank")}</SectionTitle>
                  <MetricRow label={t("rank")} value={stats.currentRank} icon={Trophy} />
                  <MetricRow label={t("total_points")} value={stats.totalPoints} icon={Star} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>

        {/* Account Card - always visible */}
        <Card>
          <CardContent className="p-4">
            <SectionTitle>{t("account")}</SectionTitle>
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
              {t("logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};
