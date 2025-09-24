import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Moon, Globe, Database, MapPin, Mic, Trash2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    newTasks: true,
    reminders: true,
    achievements: false
  });
  
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("english");
  const [offlineMode, setOfflineMode] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);

  const handleClearCache = () => {
    toast({
      title: "Cache Cleared",
      description: "App cache has been successfully cleared"
    });
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

        {/* Privacy */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Privacy</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="text-black">Location Services</span>
                  </div>
                  <Switch 
                    checked={locationServices}
                    onCheckedChange={setLocationServices}
                  />
                </div>
                <p className="text-xs text-gray-500 ml-8 mt-1">
                  Used for tracking visits and route optimization
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-gray-600" />
                    <span className="text-black">Microphone Access</span>
                  </div>
                  <Switch 
                    checked={microphoneAccess}
                    onCheckedChange={setMicrophoneAccess}
                  />
                </div>
                <p className="text-xs text-gray-500 ml-8 mt-1">
                  Required for audio recording during interactions
                </p>
              </div>
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