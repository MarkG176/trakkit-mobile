// [CMP-a4a4ba] Settings — app settings page
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Moon, Globe, Database, MapPin, Mic, Trash2, Info, Camera, HardDrive, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuidance } from "@/components/PermissionGuidance";
import { Badge } from "@/components/ui/badge";
import { PermissionStatus } from "@/utils/permissionUtils";

export const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { permissions, requestPermission, browserType } = usePermissions();
  const [requestingPermission, setRequestingPermission] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState({
    newTasks: true,
    reminders: true,
    achievements: false
  });
  
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("english");
  const [offlineMode, setOfflineMode] = useState(true);

  const handleClearCache = () => {
    toast({
      title: "Cache Cleared",
      description: "App cache has been successfully cleared"
    });
  };

  const getStatusBadge = (status: PermissionStatus | null) => {
    switch (status) {
      case 'granted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✓ Granted</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">✗ Denied</Badge>;
      case 'prompt':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">? Need to grant</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
    }
  };

  const handleRequestPermission = async (type: 'camera' | 'location' | 'storage' | 'microphone' | 'notification') => {
    setRequestingPermission(type);
    try {
      const result = await requestPermission(type);
      if (result) {
        toast({
          title: "Permission Granted",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} permission granted successfully.`
        });
      } else {
        toast({
          title: "Permission Denied",
          description: `Unable to grant ${type} permission. Please check browser settings.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request permission",
        variant: "destructive"
      });
    } finally {
      setRequestingPermission(null);
    }
  };

  const PermissionRow = ({ 
    type, 
    title, 
    description, 
    icon 
  }: { 
    type: 'camera' | 'location' | 'storage' | 'microphone' | 'notification'; 
    title: string; 
    description: string; 
    icon: React.ReactNode;
  }) => {
    const status = permissions?.[type]?.status || 'unknown';
    const isGranted = status === 'granted';
    const isDenied = status === 'denied';

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {icon}
            <span className="text-black">{title}</span>
          </div>
          {getStatusBadge(status as PermissionStatus | null)}
        </div>
        <p className="text-xs text-gray-500 ml-8 mb-2">{description}</p>
        
        {!isGranted && (
          <div className="ml-8">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => handleRequestPermission(type)}
              disabled={requestingPermission !== null}
            >
              {requestingPermission === type ? (
                <>
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Grant Permission'
              )}
            </Button>
          </div>
        )}

        {isDenied && (
          <div className="ml-0 mt-2">
            <PermissionGuidance
              permissionType={type}
              browserType={browserType}
              onRetry={() => handleRequestPermission(type)}
              className="mt-2"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Settings</h1>
        </div>
        
        <p className="text-sm opacity-90">Customize your app experience</p>
      </div>

      <div className="p-4 space-y-6">
        {/* General Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">General Settings</h3>
            
            <div className="space-y-4">
              {/* Notification Preferences */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-black">Notification Preferences</span>
                </div>
                
                <div className="space-y-3 ml-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Task Assignment</span>
                    <Switch 
                      checked={notifications.newTasks}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, newTasks: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">App Reminders</span>
                    <Switch 
                      checked={notifications.reminders}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, reminders: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Achievement Alerts</span>
                    <Switch 
                      checked={notifications.achievements}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, achievements: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-600" />
                  <span className="text-black">Dark Mode</span>
                </div>
                <Switch 
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-black">Language</span>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="swahili">Swahili</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Data & Storage</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-600" />
                  <span className="text-black">Offline Mode</span>
                </div>
                <Switch 
                  checked={offlineMode}
                  onCheckedChange={setOfflineMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-gray-600" />
                  <span className="text-black">Clear Cache</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearCache}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Permissions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Permissions</h3>
            
            <div className="space-y-4">
              <PermissionRow
                type="camera"
                title="Camera"
                description="For check-in selfies and photo captures"
                icon={<Camera className="w-5 h-5 text-gray-600" />}
              />

              <div className="border-t border-gray-200 pt-4" />

              <PermissionRow
                type="location"
                title="Location Services"
                description="For tracking visits and route optimization"
                icon={<MapPin className="w-5 h-5 text-gray-600" />}
              />

              <div className="border-t border-gray-200 pt-4" />

              <PermissionRow
                type="microphone"
                title="Microphone"
                description="For audio recording during interactions"
                icon={<Mic className="w-5 h-5 text-gray-600" />}
              />

              <div className="border-t border-gray-200 pt-4" />

              <PermissionRow
                type="storage"
                title="Storage"
                description="For offline data and app caching"
                icon={<HardDrive className="w-5 h-5 text-gray-600" />}
              />

              <div className="border-t border-gray-200 pt-4" />

              <PermissionRow
                type="notification"
                title="Notifications"
                description="For important alerts and reminders"
                icon={<Bell className="w-5 h-5 text-gray-600" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* About App */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">About App</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">App Version</span>
                <span className="text-black font-medium">v1.2.0</span>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  <span className="text-blue-600">Privacy Policy</span>
                </Button>
                
                <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                  <span className="text-blue-600">Terms of Service</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};