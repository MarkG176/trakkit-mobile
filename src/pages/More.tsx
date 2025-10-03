import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User, Settings, HelpCircle, LogOut, BarChart, FileText, MessageSquare } from "lucide-react";

export const More = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: "Profile", action: () => navigate("/profile") },
    { icon: BarChart, label: "Reports", action: () => navigate("/reports") },
    { icon: FileText, label: "Documentation", action: () => navigate("/documentation") },
    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
    { icon: HelpCircle, label: "Help & Support", action: () => navigate("/help-support") },
    { icon: MessageSquare, label: "Interaction History", action: () => navigate("/interaction-history") },
    { icon: LogOut, label: "Logout", action: handleSignOut, dangerous: true },
  ];

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">More</h1>
        <p className="text-sm opacity-90">Signed in as: {user?.email}</p>
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