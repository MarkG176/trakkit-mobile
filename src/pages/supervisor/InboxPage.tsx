import { useState, useEffect, useMemo } from "react";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Bug, Package, BarChart3, Inbox, Image as ImageIcon, Trash2, Send, ChevronDown, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

interface Ticket {
  id: string;
  agent_name: string;
  agent_email: string;
  ticket_type: string;
  inventory_issue_type: string | null;
  message: string;
  image_url: string | null;
  status: string;
  created_at: string;
  project_id: string | null;
}

const typeConfig: Record<string, { label: string; icon: typeof Bug; color: string; badgeClass: string }> = {
  bug_support: { label: 'Bug Support', icon: Bug, color: 'text-red-600', badgeClass: 'bg-red-100 text-red-700 border-red-200' },
  inventory_request: { label: 'Inventory', icon: Package, color: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  missing_stats: { label: 'Missing Stats', icon: BarChart3, color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-gray-100 text-gray-600',
  closed: 'bg-gray-100 text-gray-500',
};

interface WorkspaceMember {
  user_id: string;
  name: string | null;
  email: string | null;
}

export const InboxPage = () => {
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Compose message state
  const [showCompose, setShowCompose] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<WorkspaceMember | null>(null);
  const [composeMessage, setComposeMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!recipientSearch.trim()) return members;
    const q = recipientSearch.toLowerCase();
    return members.filter(m =>
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
  }, [members, recipientSearch]);

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

  const fetchTickets = async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);

    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (currentProjectId) {
      query = query.eq('project_id', currentProjectId);
    }

    const { data } = await query;
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    fetchMembers();
  }, [currentWorkspaceId, currentProjectId]);

  const handleSendMessage = async () => {
    if (!selectedRecipient || !composeMessage.trim() || !user) return;
    setSending(true);
    try {
      const senderName = user.user_metadata?.display_name || user.email || 'Supervisor';
      const { error } = await supabase.from('supervisor_messages').insert({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: selectedRecipient.user_id,
        message: composeMessage.trim(),
        workspace_id: currentWorkspaceId,
      });
      if (error) throw error;
      toast({ title: "Message sent", description: `Sent to ${selectedRecipient.name || selectedRecipient.email}` });
      setComposeMessage("");
      setSelectedRecipient(null);
      setShowCompose(false);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filtered = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.agent_name?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q) ||
      typeConfig[t.ticket_type]?.label.toLowerCase().includes(q)
    );
  });

  const updateStatus = async (ticketId: string, newStatus: string) => {
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
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
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setSelectedTicket(null);
      toast({ title: "Ticket deleted" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold">Inbox</h1>
            <p className="text-sm opacity-90">Agent support tickets</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30"
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showCompose ? 'Cancel' : 'Message'}
          </Button>
        </div>
        <WorkspaceSwitcher className="w-full" />
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets by agent, type, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Compose Message */}
      {showCompose && (
        <div className="px-4 pb-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Send Message</span>
              </div>

              {/* Recipient selector */}
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
                        Select agent...
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(100vw-4rem)] p-2 z-50 bg-popover" align="start">
                      <Input
                        placeholder="Search agents..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="mb-2 h-9"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredMembers.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-3">No agents found</p>
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
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                rows={3}
              />

              <Button
                className="w-full"
                disabled={!selectedRecipient || !composeMessage.trim() || sending}
                onClick={handleSendMessage}
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets List */}
      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="px-4 space-y-3 pb-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No tickets found</p>
            </Card>
          ) : (
            filtered.map((ticket) => {
              const config = typeConfig[ticket.ticket_type] || typeConfig.bug_support;
              const Icon = config.icon;
              return (
                <Card
                  key={ticket.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.badgeClass}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm truncate">{ticket.agent_name || 'Agent'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          {ticket.image_url && <ImageIcon className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedTicket && (() => {
            const config = typeConfig[selectedTicket.ticket_type] || typeConfig.bug_support;
            const Icon = config.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    {config.label}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">From</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.agent_name} ({selectedTicket.agent_email})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">{format(new Date(selectedTicket.created_at), 'PPpp')}</p>
                  </div>
                  {selectedTicket.inventory_issue_type && (
                    <div>
                      <p className="text-sm font-medium">Issue Type</p>
                      <Badge variant="outline">{selectedTicket.inventory_issue_type.replace('_', ' ')}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Message</p>
                    <p className="text-sm mt-1 bg-muted p-3 rounded-lg">{selectedTicket.message}</p>
                  </div>
                  {selectedTicket.image_url && (
                    <div>
                      <p className="text-sm font-medium mb-2">Attachment</p>
                      <img src={selectedTicket.image_url} alt="Ticket attachment" className="w-full rounded-lg border" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={selectedTicket.status === s ? 'default' : 'outline'}
                          onClick={() => updateStatus(selectedTicket.id, s)}
                          className="text-xs capitalize"
                        >
                          {s.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full mt-2">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Ticket
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove the ticket from the inbox.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTicket(selectedTicket.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <SupervisorBottomNav />
    </div>
  );
};
