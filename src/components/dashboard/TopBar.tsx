import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface TopBarProps {
  onCameraCapture?: (imageData: string) => void;
}

export const TopBar = ({ onCameraCapture }: TopBarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching display name:', error);
          setDisplayName(user.email?.split('@')[0] || 'User');
        } else {
          setDisplayName(data?.display_name || user.email?.split('@')[0] || 'User');
        }
      } catch (error) {
        console.error('Error:', error);
        setDisplayName(user.email?.split('@')[0] || 'User');
      }
    };

    fetchDisplayName();
  }, [user]);

  const handleSetLocation = () => {
    navigate('/routes');
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-h3">Hello, {displayName}!</span>
        </div>
        
        <Button 
          onClick={handleSetLocation}
          variant="default"
          size="sm"
          className="flex items-center gap-2"
        >
          <MapPin size={16} />
          Set Location
        </Button>
      </div>
      
      {/* Workspace Switcher */}
      <div className="flex items-center justify-between">
        <WorkspaceSwitcher onWorkspaceChange={(workspaceId) => {
          // Workspace context will automatically update via useWorkspace hook
          // No need to reload the page - React state management handles this
          console.log('Workspace changed to:', workspaceId);
        }} />
      </div>
    </div>
  );
};