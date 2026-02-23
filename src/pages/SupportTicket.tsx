import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bug, Package, BarChart3, Upload, X, CheckCircle2, Inbox, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TicketType = 'bug_support' | 'inventory_request' | 'missing_stats';
type InventoryIssueType = 'missing_inventory' | 'incorrect_inventory_details';

interface MyTicket {
  id: string;
  ticket_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface SupervisorMessage {
  id: string;
  sender_name: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
}

const ticketOptions = [
  {
    type: 'bug_support' as TicketType,
    label: 'Bug Support',
    description: 'Report app bugs or technical issues',
    icon: Bug,
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
  },
  {
    type: 'inventory_request' as TicketType,
    label: 'Inventory Request',
    description: 'Report missing or incorrect inventory',
    icon: Package,
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    type: 'missing_stats' as TicketType,
    label: 'Missing Stats',
    description: 'Report missing or inaccurate statistics',
    icon: BarChart3,
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
];

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-gray-100 text-gray-600',
  closed: 'bg-gray-100 text-gray-500',
};

const typeLabels: Record<string, string> = {
  bug_support: 'Bug Support',
  inventory_request: 'Inventory',
  missing_stats: 'Missing Stats',
};

export const SupportTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [message, setMessage] = useState("");
  const [inventoryIssueType, setInventoryIssueType] = useState<InventoryIssueType | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [supervisorMessages, setSupervisorMessages] = useState<SupervisorMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const fetchMyTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('id, ticket_type, message, status, created_at')
      .eq('agent_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setMyTickets((data as MyTicket[]) || []);
    setLoadingTickets(false);
  };

  const fetchSupervisorMessages = async () => {
    if (!user) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from('supervisor_messages')
      .select('id, sender_name, message, created_at, is_read')
      .eq('recipient_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    setSupervisorMessages((data as SupervisorMessage[]) || []);
    setLoadingMessages(false);

    // Mark unread messages as read
    if (data && data.length > 0) {
      const unread = data.filter((m: any) => !m.is_read).map((m: any) => m.id);
      if (unread.length > 0) {
        await supabase
          .from('supervisor_messages')
          .update({ is_read: true })
          .in('id', unread);
      }
    }
  };

  useEffect(() => {
    fetchMyTickets();
    fetchSupervisorMessages();

    // Subscribe to realtime changes for tickets
    const ticketChannel = supabase
      .channel('my-tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets',
        filter: `agent_id=eq.${user?.id}`,
      }, () => {
        fetchMyTickets();
      })
      .subscribe();

    // Subscribe to realtime changes for supervisor messages
    const messageChannel = supabase
      .channel('my-supervisor-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'supervisor_messages',
        filter: `recipient_id=eq.${user?.id}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        setSupervisorMessages(prev => [{
          id: newMsg.id,
          sender_name: newMsg.sender_name,
          message: newMsg.message,
          created_at: newMsg.created_at,
          is_read: false,
        }, ...prev]);
        toast({
          title: `Message from ${newMsg.sender_name || 'Supervisor'}`,
          description: newMsg.message.slice(0, 100),
        });
        // Mark as read
        supabase.from('supervisor_messages').update({ is_read: true }).eq('id', newMsg.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const canSubmit = () => {
    if (!selectedType || !message.trim()) return false;
    if (selectedType === 'bug_support' && !imageFile) return false;
    if (selectedType === 'inventory_request' && !inventoryIssueType) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !user) return;

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `support-tickets/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('check-in-selfies')
          .upload(filePath, imageFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('check-in-selfies')
            .getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('support_tickets').insert({
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        project_id: currentProjectId,
        ticket_type: selectedType!,
        inventory_issue_type: selectedType === 'inventory_request' ? inventoryIssueType : null,
        message: message.trim(),
        image_url: imageUrl,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Failed to submit ticket",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ is_deleted: true })
      .eq('id', ticketId);

    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setMyTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast({ title: "Ticket deleted" });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('supervisor_messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      setSupervisorMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast({ title: "Message deleted" });
    }
  };

  if (submitted) {
    return (
      <MobileLayout currentPage="chat">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/support-ticket")} className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Ticket Submitted</h1>
          </div>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center mt-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Thank you!</h2>
          <p className="text-muted-foreground mb-6">
            Our team is already working on your request. We'll get back to you as soon as possible.
          </p>
          <Button onClick={() => { setSubmitted(false); setSelectedType(null); setMessage(""); setImageFile(null); setImagePreview(null); fetchMyTickets(); }} className="w-full">
            Back to Chat
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="chat">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold">Chat</h1>
        </div>
        <p className="text-sm opacity-90">Choose the type of issue you're experiencing</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Supervisor Messages */}
        {supervisorMessages.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Messages</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{supervisorMessages.length}</Badge>
              </div>
              <div className="space-y-2">
                {supervisorMessages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary">{msg.sender_name || 'Supervisor'}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'MMM d, HH:mm')}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove the message from your view.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ticket Type Selection */}
        <div className="space-y-3">
          {ticketOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.type;
            return (
              <Card
                key={option.type}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected ? option.color + ' ring-2 ring-offset-1 ring-primary/30' : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => {
                  setSelectedType(option.type);
                  setInventoryIssueType(null);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? option.badgeColor : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? option.iconColor : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{option.label}</h3>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Inventory Issue Sub-options */}
        {selectedType === 'inventory_request' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">What's the issue?</label>
            <div className="flex gap-2">
              {[
                { value: 'missing_inventory' as InventoryIssueType, label: 'Missing Inventory' },
                { value: 'incorrect_inventory_details' as InventoryIssueType, label: 'Incorrect Details' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={inventoryIssueType === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setInventoryIssueType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Field */}
        {selectedType && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Describe the issue <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Please provide as much detail as possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Image Upload for Bug Support */}
        {selectedType === 'bug_support' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Screenshot <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">A screenshot is required for bug reports</p>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Tap to upload image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>
        )}

        {/* Submit */}
        {selectedType && (
          <Button
            className="w-full"
            disabled={!canSubmit() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        )}

        {/* My Requests */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">My Requests</h3>
              <Badge variant="secondary" className="ml-auto text-xs">{myTickets.length}</Badge>
            </div>
            {loadingTickets ? (
              <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
            ) : myTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No requests yet</p>
            ) : (
              <div className="space-y-2">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{typeLabels[ticket.ticket_type] || ticket.ticket_type}</span>
                        <Badge variant="outline" className={`text-xs ${statusColors[ticket.status] || ''}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(ticket.created_at), 'MMM d, HH:mm')}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
                          <AlertDialogDescription>This will remove the ticket from your view.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTicket(ticket.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};
