import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock } from "lucide-react";

interface RouteStop {
  id: string;
  clientName: string;
  address: string;
  time: string;
  status: "pending" | "completed" | "current";
}

const routeData: RouteStop[] = [
  { id: "1", clientName: "Acme Corp", address: "123 Business Ave, Downtown", time: "09:00", status: "completed" },
  { id: "2", clientName: "Tech Solutions", address: "456 Innovation Dr, Tech Park", time: "10:30", status: "current" },
  { id: "3", clientName: "Global Industries", address: "789 Corporate Blvd, Business District", time: "12:00", status: "pending" },
  { id: "4", clientName: "Metro Enterprises", address: "321 Market St, City Center", time: "14:30", status: "pending" },
];

export const Routes = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-success";
      case "current": return "text-primary";
      case "pending": return "text-secondary-foreground";
      default: return "text-secondary-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10";
      case "current": return "bg-primary/10";
      case "pending": return "bg-muted";
      default: return "bg-muted";
    }
  };

  return (
    <MobileLayout currentPage="routes">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Routes & Planning</h1>
        <p className="text-sm opacity-90">Today's route schedule</p>
      </div>

      {/* Map Placeholder */}
      <div className="h-48 bg-accent m-4 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin size={32} className="text-primary mx-auto mb-2" />
          <p className="text-secondary">Interactive map will be displayed here</p>
          <p className="text-xs text-secondary-foreground">Showing 4 stops for today</p>
        </div>
      </div>

      {/* Route List */}
      <div className="px-4 pb-4">
        <h2 className="text-h3 mb-3">Today's Stops</h2>
        <div className="space-y-3">
          {routeData.map((stop, index) => (
            <div key={stop.id} className={`performance-card ${getStatusBg(stop.status)}`}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    stop.status === "completed" ? "bg-success text-white border-success" :
                    stop.status === "current" ? "bg-primary text-primary-foreground border-primary" :
                    "bg-background border-border text-secondary-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  {index < routeData.length - 1 && (
                    <div className="w-0.5 h-8 bg-border mt-1"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-h3 ${getStatusColor(stop.status)}`}>{stop.clientName}</h3>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-secondary-foreground" />
                      <span className="text-xs text-secondary-foreground">{stop.time}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-secondary-foreground mb-3">{stop.address}</p>
                  
                  {stop.status !== "completed" && (
                    <Button 
                      variant={stop.status === "current" ? "default" : "outline"} 
                      size="sm" 
                      className="w-full"
                    >
                      <Navigation size={14} className="mr-2" />
                      Get Directions
                    </Button>
                  )}
                  
                  {stop.status === "completed" && (
                    <div className="text-sm text-success font-medium">✓ Completed</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};