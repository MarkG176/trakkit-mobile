import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { User, Settings, HelpCircle, LogOut, BarChart, FileText } from "lucide-react";

export const More = () => {
  const menuItems = [
    { icon: User, label: "Profile", action: () => {} },
    { icon: BarChart, label: "Reports", action: () => {} },
    { icon: FileText, label: "Documentation", action: () => {} },
    { icon: Settings, label: "Settings", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
    { icon: LogOut, label: "Logout", action: () => {}, dangerous: true },
  ];

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">More</h1>
        <p className="text-sm opacity-90">Additional options and settings</p>
      </div>

      <div className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start h-14 ${
                item.dangerous ? "text-destructive hover:text-destructive" : ""
              }`}
              onClick={item.action}
            >
              <Icon size={20} className="mr-3" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </MobileLayout>
  );
};