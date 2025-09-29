import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Award, Target, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [performanceData, setPerformanceData] = useState({
    totalPoints: 0,
    surveysCompleted: 0,
    salesThisMonth: 0,
    rank: "",
    teamName: "",
    managerName: ""
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0,0,0,0);
        const nowIso = new Date().toISOString();
        const monthStartIso = firstDayOfMonth.toISOString();

        const [{ data: surveys }, { data: sales }, { data: profile }] = await Promise.all([
          supabase
            .from('interactions')
            .select('*, agent_tasks!inner(*)')
            .eq('agent_tasks.agent_id', user.id)
            .eq('interaction_type', 'survey'),
          supabase
            .from('interactions')
            .select('*, agent_tasks!inner(*)')
            .eq('agent_tasks.agent_id', user.id)
            .eq('interaction_type', 'sale')
            .gte('created_at', monthStartIso)
            .lte('created_at', nowIso),
          supabase
            .from('agent_profiles')
            .select('*')
            .eq('agent_id', user.id)
            .single()
        ]);

        setPerformanceData({
          totalPoints: (surveys?.length || 0) * 10 + (sales?.length || 0) * 20,
          surveysCompleted: surveys?.length || 0,
          salesThisMonth: sales?.length || 0,
          rank: profile?.rank || "Agent",
          teamName: profile?.team_name || "",
          managerName: profile?.manager_name || ""
        });
      } catch (err) {
        console.error('Failed to load profile data', err);
      }
    };
    fetchProfileData();
  }, [user]);

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">My Profile</h1>
        </div>
        
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-white text-primary text-lg font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Agent Profile</h2>
            <p className="text-sm opacity-90">{performanceData.rank}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Edit2 size={20} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Profile Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <span className="text-black font-medium">{user?.email}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Role:</span>
                <span className="text-black font-medium">{performanceData.rank || 'Field Agent'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Team:</span>
                <span className="text-black font-medium">{performanceData.teamName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Manager:</span>
                <span className="text-black font-medium">{performanceData.managerName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Snapshot */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Performance Snapshot</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary-light rounded-lg">
                <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{performanceData.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              
              <div className="text-center p-3 bg-accent rounded-lg">
                <Target className="w-6 h-6 text-accent-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-accent-foreground">{performanceData.surveysCompleted}</p>
                <p className="text-sm text-muted-foreground">Surveys Done</p>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{performanceData.salesThisMonth}</p>
                <p className="text-sm text-muted-foreground">Sales This Month</p>
              </div>
              
              <div className="text-center p-3 bg-card border rounded-lg">
                <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                  {performanceData.rank.split(' ')[0]}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">Current Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Account Settings</h3>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};