import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, ShoppingCart, ClipboardList, Gift, MessageSquare, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data for interaction history
const interactions = [
  {
    id: "1",
    date: "2024-01-15",
    time: "14:30",
    type: "sale",
    clientName: "John Doe",
    hasRecording: true,
    points: 25,
    sentiment: 5,
    notes: "Customer was very satisfied with the solar panel demonstration"
  },
  {
    id: "2", 
    date: "2024-01-15",
    time: "11:45",
    type: "survey",
    clientName: "Jane Smith",
    hasRecording: true,
    points: 15,
    sentiment: 4,
    notes: "Completed customer satisfaction survey"
  },
  {
    id: "3",
    date: "2024-01-14",
    time: "16:20",
    type: "giveaway",
    clientName: "Mike Johnson",
    hasRecording: false,
    points: 8,
    sentiment: 4,
    notes: "Distributed sample brochures and LED light demo"
  },
  {
    id: "4",
    date: "2024-01-14",
    time: "10:15",
    type: "interaction",
    clientName: "Sarah Wilson",
    hasRecording: true,
    points: 10,
    sentiment: 3,
    notes: "General consultation about solar energy solutions"
  }
];

const getInteractionIcon = (type: string) => {
  switch (type) {
    case "sale":
      return <ShoppingCart size={20} className="text-green-600" />;
    case "survey":
      return <ClipboardList size={20} className="text-blue-600" />;
    case "giveaway":
      return <Gift size={20} className="text-purple-600" />;
    case "interaction":
      return <MessageSquare size={20} className="text-gray-600" />;
    default:
      return <MessageSquare size={20} className="text-gray-600" />;
  }
};

const getInteractionTypeLabel = (type: string) => {
  switch (type) {
    case "sale":
      return "Sale";
    case "survey": 
      return "Survey";
    case "giveaway":
      return "Giveaway";
    case "interaction":
      return "Interaction";
    default:
      return "Unknown";
  }
};

const getInteractionTypeColor = (type: string) => {
  switch (type) {
    case "sale":
      return "bg-green-100 text-green-800";
    case "survey":
      return "bg-primary-light text-primary";
    case "giveaway":
      return "bg-accent text-accent-foreground";
    case "interaction":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const InteractionHistory = () => {
  const navigate = useNavigate();

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
          <h1 className="text-h1">Interaction History</h1>
        </div>
        <p className="text-sm opacity-90">All your recorded interactions and engagements</p>
      </div>

      <div className="p-4 space-y-4">
        {interactions.map((interaction) => (
          <Card key={interaction.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getInteractionIcon(interaction.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getInteractionTypeColor(interaction.type)}>
                      {getInteractionTypeLabel(interaction.type)}
                    </Badge>
                    {interaction.hasRecording && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Mic size={14} />
                        <Play size={14} />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-black mb-1">{interaction.clientName}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{interaction.date}</span>
                    <span>{interaction.time}</span>
                    <span className="text-blue-600">+{interaction.points} pts</span>
                  </div>
                  
                  {interaction.notes && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {interaction.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-gray-500">Sentiment:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-3 h-3 rounded-full ${
                          star <= interaction.sentiment
                            ? "bg-yellow-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {interactions.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No interactions yet</h3>
            <p className="text-gray-500">Start logging your interactions to see them here</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};