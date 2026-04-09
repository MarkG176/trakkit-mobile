import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, MessageCircle, Bug, HelpCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const HelpSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContactSupport = (method: string) => {
    toast({
      title: "Opening Support",
      description: `Opening ${method} support...`
    });
  };

  const handleSubmitTicket = () => {
    navigate("/support-ticket");
  };

  const supportOptions = [
    {
      id: "call",
      title: "Call Support",
      description: "Speak directly with our support team",
      icon: Phone,
      color: "text-green-600",
      action: () => handleContactSupport("phone")
    },
    {
      id: "email", 
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      icon: Mail,
      color: "text-blue-600",
      action: () => handleContactSupport("email")
    },
    {
      id: "chat",
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      icon: MessageCircle,
      color: "text-purple-600",
      action: () => handleContactSupport("chat")
    },
    {
      id: "ticket",
      title: "Submit a Ticket",
      description: "Create a detailed support request",
      icon: HelpCircle,
      color: "text-orange-600",
      action: handleSubmitTicket
    }
  ];

  const quickLinks = [
    {
      title: "How to record a sale",
      category: "Sales"
    },
    {
      title: "Troubleshooting recording issues",
      category: "Technical"
    },
    {
      title: "Understanding point system",
      category: "General"
    },
    {
      title: "Managing offline data",
      category: "Technical"
    }
  ];

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
          <h1 className="text-h1">Help & Support</h1>
        </div>
        
        <p className="text-sm opacity-90">Get assistance when you need it</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Support Options */}
        <div className="grid grid-cols-2 gap-3">
          {supportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={option.action}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-8 h-8 ${option.color} mx-auto mb-2`} />
                  <h3 className="font-medium text-black mb-1">{option.title}</h3>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bug Report */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-black">Report a Bug</h3>
                  <p className="text-sm text-gray-600">Help us improve the app</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Center */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 text-black">Help Center</h3>
              <Button variant="ghost" size="sm">
                <ExternalLink size={16} />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Access our comprehensive knowledge base and guides
            </p>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://trakkit.darajatech.com/docs", "_blank")}
            >
              Visit Help Center
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links / Popular FAQs */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Popular Help Topics</h3>
            
            <div className="space-y-3">
              {quickLinks.map((link, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 cursor-pointer"
                  onClick={() => navigate("/documentation")}
                >
                  <div>
                    <p className="text-sm font-medium text-black">{link.title}</p>
                    <p className="text-xs text-gray-500">{link.category}</p>
                  </div>
                  <ExternalLink size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h3 className="text-h3 mb-2 text-red-800">Emergency Contact</h3>
            <p className="text-sm text-red-700 mb-3">
              For urgent issues affecting your work or safety
            </p>
            <Button variant="destructive" className="w-full">
              <Phone size={16} className="mr-2" />
              Emergency Hotline: +254 700 000 000
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};