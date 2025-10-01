import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Package, MapPin, Clock, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SupervisorDashboard = () => {
  const navigate = useNavigate();
  return (
    <MobileLayout currentPage="dashboard">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Supervisor Dashboard</h1>
        <p className="text-sm opacity-90">Team overview and management</p>
      </div>

      {/* Team Overview Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Active Agents</p>
              <p className="text-h2 font-bold text-primary">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Today's Sales</p>
              <p className="text-h2 font-bold text-success">KES 45,230</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Package className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Pending Returns</p>
              <p className="text-h2 font-bold text-warning">8</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <MapPin className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Routes Active</p>
              <p className="text-h2 font-bold text-destructive">6</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Status */}
      <div className="px-4 pb-4">
        <h2 className="text-h3 mb-3">Agent Status</h2>
        <div className="space-y-3">
          {[
            { name: "John Doe", status: "active", location: "Route A", lastUpdate: "2 min ago" },
            { name: "Jane Smith", status: "active", location: "Route B", lastUpdate: "5 min ago" },
            { name: "Mike Johnson", status: "break", location: "Office", lastUpdate: "15 min ago" },
            { name: "Sarah Wilson", status: "active", location: "Route C", lastUpdate: "1 min ago" },
          ].map((agent, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{agent.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-secondary-foreground" />
                      <span className="text-sm text-secondary-foreground">{agent.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={10} className="text-secondary-foreground" />
                    <span className="text-xs text-secondary-foreground">{agent.lastUpdate}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-20">
        <h2 className="text-h3 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/manage-agents')}
          >
            <Users size={20} />
            <span className="text-sm">Manage Agents</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <TrendingUp size={20} />
            <span className="text-sm">View Reports</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Package size={20} />
            <span className="text-sm">Inventory</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Phone size={20} />
            <span className="text-sm">Support</span>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};