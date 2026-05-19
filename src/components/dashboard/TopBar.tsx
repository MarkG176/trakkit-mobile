// [CMP-697f97] TopBar — top bar component
import { MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const TopBar = () => {
  const { user, signOut } = useAuth();
  const showSetLocation = false;
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
        
        <div className="flex items-center gap-2">
          {showSetLocation && (
            <Button 
              onClick={handleSetLocation}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <MapPin size={16} />
              Set Location
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-9 w-9 border-2 border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <p className="text-xs text-muted-foreground px-2 py-1 truncate">{user?.email}</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </PopoverContent>
          </Popover>
        </div>
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