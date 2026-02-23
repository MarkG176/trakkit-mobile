import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bug, Package, BarChart3, Upload, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TicketType = 'bug_support' | 'inventory_request' | 'missing_stats';
type InventoryIssueType = 'missing_inventory' | 'incorrect_inventory_details';

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

      // Upload image if present
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

  if (submitted) {
    return (
      <MobileLayout currentPage="more">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/help-support")} className="text-primary-foreground hover:bg-primary-foreground/20">
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
          <Button variant="outline" onClick={() => navigate("/profile")} className="mb-3 w-full">
            Check the FAQ page
          </Button>
          <Button onClick={() => navigate("/help-support")} className="w-full">
            Back to Help & Support
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" onClick={() => navigate("/help-support")} className="text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Submit a Ticket</h1>
        </div>
        <p className="text-sm opacity-90 ml-11">Choose the type of issue you're experiencing</p>
      </div>

      <div className="p-4 space-y-4">
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
      </div>
    </MobileLayout>
  );
};
