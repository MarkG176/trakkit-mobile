import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Edit, Share2, Clock, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Store {
  id: string;
  store_name: string;
  county: string;
  store_lat: number;
  store_long: number;
}

interface Route {
  id: string;
  name: string;
  assignedAgent: string;
  status: "active" | "completed" | "planning";
  stops: number;
  duration: string;
  distance: string;
}

export const Routes = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [counties, setCounties] = useState<string[]>([]);

  // Mock route data
  const [routes] = useState<Route[]>([
    {
      id: "1",
      name: "Downtown Sales Loop - Mon",
      assignedAgent: "Sarah J.",
      status: "active",
      stops: 5,
      duration: "3 hours",
      distance: "25 km"
    },
    {
      id: "2",
      name: "Westlands Route",
      assignedAgent: "John D.",
      status: "planning",
      stops: 8,
      duration: "4 hours",
      distance: "32 km"
    },
    {
      id: "3",
      name: "Eastleigh Morning Shift",
      assignedAgent: "Mary K.",
      status: "completed",
      stops: 6,
      duration: "2.5 hours",
      distance: "18 km"
    }
  ]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }

    if (data) {
      setStores(data);
      const uniqueCounties = Array.from(new Set(data.map(store => store.county)));
      setCounties(uniqueCounties);
    }
  };

  const filteredStores = selectedCounty === "all" 
    ? stores 
    : stores.filter(store => store.county === selectedCounty);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "planning": return "outline";
      default: return "outline";
    }
  };

  return (
    <MobileLayout currentPage="routes">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Routes & Planning</h1>
        <p className="text-sm opacity-90">Manage and optimize your routes</p>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="relative h-64 bg-muted m-4 rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent to-muted">
          <div className="text-center">
            <MapPin size={48} className="text-primary mx-auto mb-3 opacity-60" />
            <p className="text-base font-medium text-foreground">Interactive Route Map</p>
            <p className="text-xs text-muted-foreground mt-1">Routes and agent locations will display here</p>
          </div>
        </div>
        
        {/* Filter overlay on map */}
        <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-lg min-w-[200px]">
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">County</label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Store</label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {filteredStores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.store_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Period</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Section */}
      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2">Active Routes</h2>
          <Button size="sm" className="flex items-center gap-2">
            <Plus size={16} />
            Add Route
          </Button>
        </div>

        <div className="space-y-3">
          {routes.map((route) => (
            <Card key={route.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{route.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={14} />
                    <span>Assigned to {route.assignedAgent}</span>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(route.status)}>
                  {route.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin size={14} />
                  <span>{route.stops} stops</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock size={14} />
                  <span>{route.duration}</span>
                </div>
                <div className="text-muted-foreground">
                  {route.distance}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};