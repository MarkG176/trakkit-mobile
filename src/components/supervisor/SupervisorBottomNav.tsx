// [CMP-59be54] SupervisorBottomNav — supervisor bottom nav component
import { Home, Users, Inbox, BarChart3, MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/supervisor" },
  { id: "users", label: "Users", icon: Users, path: "/supervisor/users" },
  { id: "map", label: "Map", icon: MapPin, path: "/supervisor/map" },
  { id: "inbox", label: "Inbox", icon: Inbox, path: "/supervisor/inbox" },
  { id: "stats", label: "Stats", icon: BarChart3, path: "/supervisor/stats" },
];

export const SupervisorBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = navItems.find(item => 
    location.pathname === item.path || 
    (item.path === "/supervisor" && location.pathname === "/")
  )?.id || "dashboard";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
