import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Award, Target, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock performance data
  const performanceData = {
    totalPoints: 1250,
    surveysCompleted: 47,
    salesThisMonth: 12,
    rank: "Advanced Agent",
    teamName: "Solar Team Alpha",
    managerName: "David Johnson"
  };

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
                <span className="text-black font-medium">Field Agent</span>
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