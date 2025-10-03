import { Home, ClipboardList, Map, Package, MoreHorizontal, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavigationProps {
  currentPage: string;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "activity", label: "Activity", icon: Clock, path: "/activity" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export const BottomNavigation = ({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <div className="flex justify-around items-center h-16">
...
      </div>
    </div>
  );
};