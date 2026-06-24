// [CMP-4d41b1] SupportTicket — support ticket submission
import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bug, Package, BarChart3, Upload, X, CheckCircle2, Inbox, Trash2, MessageSquare, MapPin, Image as ImageIcon, Send, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_label: string | null;
}

interface WorkspaceMember {
  user_id: string;
  name: string | null;
  email: string | null;
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

  // Agent reply compose state
  const [showReplyCompose, setShowReplyCompose] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<WorkspaceMember | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyLocation, setReplyLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const filteredMembers = (() => {
    const filtered = members.filter(m => m.user_id !== user?.id);
    if (!recipientSearch.trim()) return filtered;
    const q = recipientSearch.toLowerCase();
    return filtered.filter(m =>
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  })();

  const fetchMembers = async () => {
    if (!currentWorkspaceId) return;
    const { data } = await supabase
      .from('user_workspaces')
      .select('user_id, name, email')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .eq('is_active', true);
    setMembers((data as WorkspaceMember[]) || []);
  };

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
      .select('id, sender_name, message, created_at, is_read, image_url, location_lat, location_lng, location_label')
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
    fetchMembers();

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
          image_url: newMsg.image_url,
          location_lat: newMsg.location_lat,
          location_lng: newMsg.location_lng,
          location_label: newMsg.location_label,
        }, ...prev]);
        toast({
          title: `Message from ${newMsg.sender_name || 'Supervisor'}`,
          description: newMsg.message.slice(0, 100),
        });
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
        const compressed = await compressImage(imageFile);
        const filePath = `support-tickets/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('check-in-selfies')
          .upload(filePath, compressed);

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

  const handleReplyImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyImage(file);
      const reader = new FileReader();
      reader.onload = () => setReplyImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReplyAttachLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReplyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
        setGettingLocation(false);
      },
      (err) => {
        toast({ title: "Location error", description: err.message, variant: "destructive" });
        setGettingLocation(false);
      }
    );
  };

  const handleSendReply = async () => {
    if (!selectedRecipient || !replyMessage.trim() || !user) return;
    setReplySending(true);
    try {
      let imageUrl: string | null = null;
      if (replyImage) {
        const compressed = await compressImage(replyImage);
        const filePath = `supervisor-messages/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('check-in-selfies')
          .upload(filePath, compressed);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('check-in-selfies').getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }
      }

      const senderName = user.user_metadata?.display_name || user.email || 'Agent';
      const { error } = await supabase.from('supervisor_messages').insert({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: selectedRecipient.user_id,
        message: replyMessage.trim(),
        workspace_id: currentWorkspaceId,
        image_url: imageUrl,
        location_lat: replyLocation?.lat || null,
        location_lng: replyLocation?.lng || null,
        location_label: replyLocation?.label || null,
      });
      if (error) throw error;
      toast({ title: "Message sent", description: `Sent to ${selectedRecipient.name || selectedRecipient.email}` });
      setReplyMessage("");
      setSelectedRecipient(null);
      setShowReplyCompose(false);
      setReplyImage(null);
      setReplyImagePreview(null);
      setReplyLocation(null);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setReplySending(false);
    }
  };

  const openLocationInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
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
                    {msg.image_url && (
                      <img src={msg.image_url} alt="Attachment" className="mt-2 w-full max-w-xs rounded-lg border" />
                    )}
                    {msg.location_lat && msg.location_lng && (
                      <button
                        onClick={() => openLocationInMaps(msg.location_lat!, msg.location_lng!)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {msg.location_label || 'View Location'}
                        <span className="text-muted-foreground ml-1">→ Open in Maps</span>
                      </button>
                    )}
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

      {/* Agent Reply Compose Dialog */}
      <Dialog open={showReplyCompose} onOpenChange={setShowReplyCompose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Send Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
              {selectedRecipient ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/50">
                  <span className="text-sm flex-1">{selectedRecipient.name || selectedRecipient.email}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedRecipient(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Popover open={recipientOpen} onOpenChange={setRecipientOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-sm font-normal text-muted-foreground">
                      Select recipient...
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-4rem)] p-2 z-50 bg-popover" align="start">
                    <Input
                      placeholder="Search..."
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      className="mb-2 h-9"
                      autoFocus
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No members found</p>
                      ) : (
                        filteredMembers.map((m) => (
                          <button
                            key={m.user_id}
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                            onClick={() => {
                              setSelectedRecipient(m);
                              setRecipientOpen(false);
                              setRecipientSearch("");
                            }}
                          >
                            <span className="font-medium">{m.name || 'Unnamed'}</span>
                            {m.email && <span className="text-xs text-muted-foreground ml-2">{m.email}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <Textarea
              placeholder="Type your message..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
            />

            {/* Attachment options */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleReplyImageSelect} />
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded-md px-3 py-2 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Image
                </div>
              </label>
              <button
                onClick={handleReplyAttachLocation}
                disabled={gettingLocation}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border rounded-md px-3 py-2 transition-colors disabled:opacity-50"
              >
                <MapPin className="w-3.5 h-3.5" />
                {gettingLocation ? 'Getting...' : 'Location'}
              </button>
            </div>

            {replyImagePreview && (
              <div className="relative inline-block">
                <img src={replyImagePreview} alt="Attachment" className="w-24 h-24 object-cover rounded-lg border" />
                <button
                  onClick={() => { setReplyImage(null); setReplyImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {replyLocation && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs flex-1">{replyLocation.label}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyLocation(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedRecipient || !replyMessage.trim() || replySending}
              onClick={handleSendReply}
            >
              <Send className="w-4 h-4 mr-2" />
              {replySending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};
