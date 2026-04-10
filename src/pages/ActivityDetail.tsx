import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Pencil, Save, X } from "lucide-react";
import { ImageCaptionInput } from "@/components/ImageCaptionInput";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatProductName } from "@/utils/formatProductName";

interface ActivityData {
  id: string;
  timestamp: string;
  customer_name: string | null;
  customer_phone: string | null;
  sale_value: number;
  interaction_type: string;
  image_url: string | null;
  product_variant_id: string | null;
  product_name: string | null;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export const ActivityDetail = () => {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const { currentWorkspaceId } = useWorkspace();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageCaption, setImageCaption] = useState("");

  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (!activityId) return;

      setLoading(true);
      try {
        const { data: interaction } = await supabase
          .from('interactions')
          .select('*, product_variants(name, sku)')
          .eq('id', activityId)
          .single();

        if (interaction) {
          const pv = (interaction as any).product_variants;
          const productName = pv ? formatProductName(pv.name, pv.sku, 'Product') : null;
          setActivity({
            ...interaction,
            product_name: productName
          });
          if (interaction.image_url) {
            setImages([interaction.image_url]);
          }
        }

        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('interaction_id', activityId)
          .order('created_at', { ascending: false });

        if (notesData) {
          setNotes(notesData);
          if (notesData.length > 0) {
            setNoteContent(notesData[0].content);
          }
        }
      } catch (err) {
        console.error('Failed to fetch activity details', err);
        toast.error('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId]);

  const handleSaveNote = async () => {
    if (!activityId || !noteContent.trim()) return;

    try {
      if (notes.length > 0) {
        await supabase
          .from('notes')
          .update({ content: noteContent })
          .eq('id', notes[0].id);
      } else {
        const { data } = await supabase
          .from('notes')
          .insert({
            interaction_id: activityId,
            content: noteContent,
            customer_name: activity?.customer_name,
            workspace_id: currentWorkspaceId
          })
          .select()
          .single();

        if (data) {
          setNotes([data]);
        }
      }

      toast.success('Note saved successfully');
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to save note', err);
      toast.error('Failed to save note');
    }
  };

  const handleAddPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activityId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${activityId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('interaction-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('interaction-images')
        .getPublicUrl(filePath);

      await supabase
        .from('interactions')
        .update({ 
          image_url: publicUrl,
          image_metadata: { 
            uploaded_at: new Date().toISOString(),
            caption: imageCaption || undefined
          }
        })
        .eq('id', activityId);

      setImages([...images, publicUrl]);
      setImageCaption("");
      toast.success('Picture added successfully');
    } catch (err) {
      console.error('Failed to upload picture', err);
      toast.error('Failed to add picture');
    }
  };

  if (loading) {
    return (
      <MobileLayout currentPage="more">
        <div className="p-4 text-center">Loading...</div>
      </MobileLayout>
    );
  }

  if (!activity) {
    return (
      <MobileLayout currentPage="more">
        <div className="p-4 text-center">Activity not found</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Activity Details</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Core Activity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">
              {activity.interaction_type === 'sale' ? 'Sale' : 
               activity.interaction_type === 'survey' ? 'Survey' : 'Giveaway'} to {activity.customer_name || 'Customer'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="text-foreground font-medium">
                {format(new Date(activity.timestamp), 'MMM dd, yyyy • HH:mm')}
              </span>
            </div>
            {activity.customer_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground font-medium">{activity.customer_phone}</span>
              </div>
            )}
            {activity.product_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="text-foreground font-medium">{activity.product_name}</span>
              </div>
            )}
            {activity.sale_value && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="text-foreground font-bold text-lg">
                  KES {activity.sale_value.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Interaction Notes</CardTitle>
            {!isEditingNotes ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingNotes(true)}
              >
                <Pencil size={16} />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setNoteContent(notes[0]?.content || "");
                  }}
                >
                  <X size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveNote}
                >
                  <Save size={16} />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditingNotes ? (
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add notes about this interaction..."
                className="min-h-[120px]"
              />
            ) : (
              <p className="text-muted-foreground">
                {notes.length > 0 ? notes[0].content : "No notes added yet"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pictures Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Attached Pictures</CardTitle>
            <label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleAddPicture}
                className="hidden"
              />
              <Button variant="ghost" size="icon" asChild>
                <span className="cursor-pointer">
                  <Camera size={16} />
                </span>
              </Button>
            </label>
          </CardHeader>
          <CardContent className="space-y-3">
            <ImageCaptionInput
              value={imageCaption}
              onChange={setImageCaption}
              placeholder="Add a caption before uploading..."
            />
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Activity image ${index + 1}`}
                    className="w-full h-24 object-cover rounded cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No pictures attached yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};
