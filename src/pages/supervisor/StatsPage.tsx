// [CMP-48dfe3] StatsPage — supervisor stats page
import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import { useAgentProfileStats } from "@/hooks/useAgentProfileStats";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock, ShoppingCart, FileText, MessageSquare, CheckCircle,
  Store, ListTodo, Trophy, Star, MapPin, ChevronsUpDown, Search, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useProjectCurrency } from "@/hooks/useProjectCurrency";

interface WorkspaceMember {
  user_id: string;
  name: string | null;
  email: string | null;
}

const formatWorkTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
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

export const StatsPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useAgentProfileStats(selectedUserId || undefined);
  const { isEnabled } = useProjectComponents();
  const { formatAmount: formatCurrency } = useProjectCurrency();
  const isWholesale = isEnabled('CRM-0034');
  const isSeeding = isEnabled('CRM-0024') || isEnabled('CRM-0023');

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('user_workspaces')
        .select('user_id, name, email')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .eq('is_active', true);
      if (data) {
        setMembers(data);
        setSelectedUserId((prev) => {
          if (prev && data.some((m) => m.user_id === prev)) return prev;
          return data.length > 0 ? data[0].user_id : null;
        });
      } else {
        setMembers([]);
        setSelectedUserId(null);
      }
    };
    fetchMembers();
  }, [currentWorkspaceId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(m =>
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const selectedMember = members.find(m => m.user_id === selectedUserId);
  const displayLabel = selectedMember?.name || selectedMember?.email?.split('@')[0] || "Select user";

  const todayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Agent Stats</h1>
        <p className="text-sm opacity-90">View individual agent performance</p>
      </div>

      {/* User Selector */}
      <div className="p-4 pb-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
              {displayLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {filteredMembers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No agents found</p>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => {
                      setSelectedUserId(member.user_id);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedUserId === member.user_id && "bg-accent"
                    )}
                  >
                    <Check className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserId === member.user_id ? "opacity-100" : "opacity-0"
                    )} />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{member.name || member.email?.split('@')[0] || 'Unknown'}</span>
                      {member.email && <span className="text-xs text-muted-foreground">{member.email}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats Content */}
      {!selectedUserId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground">Select an agent to view stats</p>
        </div>
      ) : stats.isLoading ? (
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
              <TabsTrigger value="alltime" className="flex-1">All Time</TabsTrigger>
            </TabsList>

            {/* TODAY TAB */}
            <TabsContent value="today" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">{todayDate}</p>

              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Activity & Attendance</SectionTitle>
                  {!isWholesale && !isSeeding && <MetricRow label="Check-ins" value={stats.todayCheckIns} icon={CheckCircle} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Store Visits" value={stats.todayStoreVisits} icon={Store} />}
                  <MetricRow label="Work Time" value={formatWorkTime(stats.todayWorkMinutes)} icon={Clock} />
                  {isSeeding && <MetricRow label="Stores Added" value={stats.todayStoresAdded} icon={MapPin} />}
                </CardContent>
              </Card>

              {!isWholesale && !isSeeding && (
                <Card>
                  <CardContent className="p-4">
                    <SectionTitle>Tasks</SectionTitle>
                    <MetricRow label="Total Tasks" value={stats.todayTotalTasks} icon={ListTodo} />
                    <MetricRow label="Completed" value={stats.todayCompletedTasks} icon={CheckCircle} />
                    <MetricRow label="Pending" value={stats.todayPendingTasks} icon={Clock} />
                  </CardContent>
                </Card>
              )}

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

              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Engagement</SectionTitle>
                  {(!isWholesale || isSeeding) && <MetricRow label="Interactions" value={stats.todayInteractionsCount} icon={MessageSquare} />}
                  {(!isWholesale || stats.hasSurveyAssigned || isSeeding) && (
                    <MetricRow label="Surveys Done" value={stats.todaySurveys} icon={FileText} />
                  )}
                  {!isSeeding && <MetricRow label="Giveaways" value={stats.todayGiveaways} icon={Star} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Items Given" value={stats.todayGiveawayItems} icon={Star} />}
                  {!isSeeding && <MetricRow label="Notes" value={stats.todayNotesCount} icon={FileText} />}
                </CardContent>
              </Card>
            </TabsContent>

            {/* WEEK TAB */}
            <TabsContent value="week" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Activity & Attendance</SectionTitle>
                  {!isWholesale && !isSeeding && <MetricRow label="Check-ins" value={stats.weekCheckIns} icon={CheckCircle} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Store Visits" value={stats.weekStoreVisits} icon={Store} />}
                  <MetricRow label="Work Time" value={formatWorkTime(stats.weekWorkMinutes)} icon={Clock} />
                  {!isWholesale && !isSeeding && <MetricRow label="Lunch Time" value={formatWorkTime(stats.weekLunchMinutes)} icon={Clock} />}
                  {isSeeding && <MetricRow label="Stores Added" value={stats.weekStoresAdded} icon={MapPin} />}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Sales & Revenue</SectionTitle>
                  {isWholesale ? (
                    <>
                      <MetricRow label="Products Sold" value={stats.weekWholesaleSales} icon={ShoppingCart} />
                      <MetricRow label="Revenue" value={formatCurrency(stats.weekWholesaleRevenue)} icon={ShoppingCart} />
                    </>
                  ) : isSeeding ? (
                    <>
                      <MetricRow label="Sales Made" value={stats.weekSales} icon={ShoppingCart} />
                      <MetricRow label="Revenue" value={formatCurrency(stats.weekRevenue)} icon={ShoppingCart} />
                      <MetricRow label="Giveaways" value={stats.weekGiveaways} icon={Star} />
                    </>
                  ) : (
                    <>
                      <MetricRow label="Sales Made" value={stats.weekSales} icon={ShoppingCart} />
                      <MetricRow label="Revenue" value={formatCurrency(stats.weekRevenue)} icon={ShoppingCart} />
                      <MetricRow label="Stores Added" value={stats.weekStoresAdded} icon={MapPin} />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Engagement</SectionTitle>
                  {(!isWholesale || isSeeding) && <MetricRow label="Interactions" value={stats.weekInteractionsCount} icon={MessageSquare} />}
                  {(!isWholesale || stats.hasSurveyAssigned || isSeeding) && (
                    <MetricRow label="Surveys Done" value={stats.weekSurveys} icon={FileText} />
                  )}
                  {!isSeeding && <MetricRow label="Giveaways" value={stats.weekGiveaways} icon={Star} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Items Given" value={stats.weekGiveawayItems} icon={Star} />}
                  {!isSeeding && <MetricRow label="Notes" value={stats.weekNotesCount} icon={FileText} />}
                </CardContent>
              </Card>

              {!isWholesale && !isSeeding && (
                <Card>
                  <CardContent className="p-4">
                    <SectionTitle>Points & Rank</SectionTitle>
                    <MetricRow label="Rank" value={stats.currentRank} icon={Trophy} />
                    <MetricRow label="Weekly Points" value={stats.weeklyPoints} icon={Star} />
                    <MetricRow label="Total Points" value={stats.totalPoints} icon={Star} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ALL TIME TAB */}
            <TabsContent value="alltime" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Activity & Attendance</SectionTitle>
                  {!isWholesale && !isSeeding && <MetricRow label="Check-ins" value={stats.allTimeCheckIns} icon={CheckCircle} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Store Visits" value={stats.allTimeStoreVisits} icon={Store} />}
                  {isSeeding && <MetricRow label="Stores Added" value={stats.allTimeStoresAdded} icon={MapPin} />}
                </CardContent>
              </Card>

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

              <Card>
                <CardContent className="p-4">
                  <SectionTitle>Engagement</SectionTitle>
                  {(!isWholesale || isSeeding) && <MetricRow label="Interactions" value={stats.allTimeInteractionsCount} icon={MessageSquare} />}
                  {(!isWholesale || stats.hasSurveyAssigned || isSeeding) && (
                    <MetricRow label="Surveys Done" value={stats.allTimeSurveys} icon={FileText} />
                  )}
                  {!isSeeding && <MetricRow label="Giveaways" value={stats.allTimeGiveaways} icon={Star} />}
                  {!isWholesale && !isSeeding && <MetricRow label="Items Given" value={stats.allTimeGiveawayItems} icon={Star} />}
                  {!isSeeding && <MetricRow label="Notes" value={stats.allTimeNotesCount} icon={FileText} />}
                </CardContent>
              </Card>

              {!isWholesale && !isSeeding && (
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
        </div>
      )}

      <SupervisorBottomNav />
    </div>
  );
};
