import { Home, ClipboardList, Map, Package, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CameraCapture } from "./CameraCapture";
import { StatusBar } from "./StatusBar";
import { useAgentStatus } from "@/hooks/useAgentStatus";

interface BottomNavigationProps {
  currentPage: string;
  onCameraCapture?: (imageData: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export const BottomNavigation = ({ currentPage, onCameraCapture }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { currentStatus, loading } = useAgentStatus();

  return (
    <div className="bottom-nav relative">
      <div className="absolute left-4 top-3 z-50">
        <StatusBar status={currentStatus} loading={loading} />
      </div>
      <CameraCapture onCapture={onCameraCapture} />
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="mb-1" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};