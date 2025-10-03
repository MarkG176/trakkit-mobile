import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BarChart, PieChart, TrendingUp, Download, Calendar, Clock, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("this-week");
  const [selectedCategory, setSelectedCategory] = useState("personal");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  const [personalData, setPersonalData] = useState({
    totalActivities: 0,
    averageDailyPoints: 0,
    successRate: 0,
    activityBreakdown: [
      { type: "Sales", count: 0, color: "bg-green-500" },
      { type: "Surveys", count: 0, color: "bg-blue-500" },
      { type: "Giveaways", count: 0, color: "bg-purple-500" }
    ]
  });

  const [projectData, setProjectData] = useState<Array<{ id: string; name: string; contribution: string; status: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [reportNotes, setReportNotes] = useState("");
  const [reportImages, setReportImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const startOfRange = new Date();
        const endOfRange = new Date();
        // Simple ranges; can be expanded to real ranges if needed
        if (selectedPeriod === "this-week") {
          const day = startOfRange.getDay();
          const diffToMonday = (day + 6) % 7; // 0 for Monday
          startOfRange.setDate(startOfRange.getDate() - diffToMonday);
          startOfRange.setHours(0,0,0,0);
          endOfRange.setHours(23,59,59,999);
        } else if (selectedPeriod === "last-month") {
          startOfRange.setMonth(startOfRange.getMonth() - 1, 1);
          startOfRange.setHours(0,0,0,0);
          endOfRange.setMonth(endOfRange.getMonth(), 0);
          endOfRange.setHours(23,59,59,999);
        }

        const fromIso = startOfRange.toISOString();
        const toIso = endOfRange.toISOString();

        if (selectedCategory === "personal") {
          const { data: interactionsSales } = await supabase
            .from('interactions')
            .select('*, agent_tasks!inner(*)')
            .eq('agent_tasks.agent_id', user.id)
            .eq('interaction_type', 'sale')
            .gte('created_at', fromIso)
            .lte('created_at', toIso);

          const { data: interactionsSurveys } = await supabase
            .from('interactions')
            .select('*, agent_tasks!inner(*)')
            .eq('agent_tasks.agent_id', user.id)
            .eq('interaction_type', 'survey')
            .gte('created_at', fromIso)
            .lte('created_at', toIso);

          const { data: interactionsGiveaways } = await supabase
            .from('interactions')
            .select('*, agent_tasks!inner(*)')
            .eq('agent_tasks.agent_id', user.id)
            .eq('interaction_type', 'giveaway')
            .gte('created_at', fromIso)
            .lte('created_at', toIso);

          const totalActivities = (interactionsSales?.length || 0) + (interactionsSurveys?.length || 0) + (interactionsGiveaways?.length || 0);
          const averageDailyPoints = Math.round(totalActivities * 2); // placeholder calculation
          const successRate = totalActivities > 0 ? Math.round(((interactionsSales?.length || 0) / totalActivities) * 100) : 0;

          setPersonalData({
            totalActivities,
            averageDailyPoints,
            successRate,
    activityBreakdown: [
              { type: 'Sales', count: interactionsSales?.length || 0, color: 'bg-green-500' },
              { type: 'Surveys', count: interactionsSurveys?.length || 0, color: 'bg-blue-500' },
              { type: 'Giveaways', count: interactionsGiveaways?.length || 0, color: 'bg-purple-500' }
            ]
          });
        } else {
          const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .gte('created_at', fromIso)
            .lte('created_at', toIso)
            .limit(10);

          const formatted = (projects || []).map((p: any) => ({
            id: p.id,
            name: p.name || 'Project',
            contribution: p.contribution_text || '—',
            status: p.status || 'Active'
          }));
          setProjectData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch report data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [user, selectedCategory, selectedPeriod]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setReportImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setReportImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportReport = async () => {
    if (!user) {
      toast.error("Please sign in to export reports");
      return;
    }

    setIsExporting(true);

    try {
      if (selectedCategory === "attendance") {
        toast.success("Attendance report feature coming soon!");
      } else {
        // Upload images if any
        const imageUrls: string[] = [];
        for (const image of reportImages) {
          const fileName = `${user.id}/${Date.now()}-${image.name}`;
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, image);
          
          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(fileName);
            imageUrls.push(publicUrl);
          }
        }

        const reportMetrics = selectedCategory === "personal" 
          ? {
              totalActivities: personalData.totalActivities,
              averageDailyPoints: personalData.averageDailyPoints,
              successRate: personalData.successRate,
              activityBreakdown: personalData.activityBreakdown,
              notes: reportNotes,
              images: imageUrls
            }
          : {
              projects: projectData,
              notes: reportNotes,
              images: imageUrls
            };

        const { error } = await supabase
          .from('reports')
          .insert({
            agent_id: user.id,
            report_type: selectedCategory,
            period: selectedPeriod,
            metrics: reportMetrics
          });

        if (error) throw error;

        // Generate TXT content
        const txtContent = selectedCategory === "personal" 
          ? generatePersonalReportTXT(personalData)
          : generateProjectReportTXT(projectData);
        
        downloadTXT(txtContent, `${selectedCategory}-report-${selectedPeriod}.txt`);
        toast.success("Report saved and exported successfully!");
        
        // Reset form
        setReportNotes("");
        setReportImages([]);
        setImagePreviews([]);
      }

    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const generatePersonalReportTXT = (data: typeof personalData) => {
    let content = `==============================================\n`;
    content += `         PERSONAL PERFORMANCE REPORT\n`;
    content += `==============================================\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Period: ${selectedPeriod.toUpperCase()}\n`;
    content += `Agent: ${user?.email || 'N/A'}\n\n`;
    
    content += `SUMMARY METRICS\n`;
    content += `----------------------------------------------\n`;
    content += `Total Activities:        ${data.totalActivities}\n`;
    content += `Average Daily Points:    ${data.averageDailyPoints}\n`;
    content += `Success Rate:            ${data.successRate}%\n\n`;

    content += `ACTIVITY BREAKDOWN\n`;
    content += `----------------------------------------------\n`;
    data.activityBreakdown.forEach(activity => {
      content += `${activity.type}:${' '.repeat(20 - activity.type.length)}${activity.count}\n`;
    });

    content += `\n==============================================\n`;
    content += `           END OF REPORT\n`;
    content += `==============================================\n`;
    
    return content;
  };

  const generateProjectReportTXT = (data: typeof projectData) => {
    let content = `==============================================\n`;
    content += `            PROJECT REPORT\n`;
    content += `==============================================\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Period: ${selectedPeriod.toUpperCase()}\n\n`;
    
    data.forEach((project, index) => {
      content += `PROJECT ${index + 1}\n`;
      content += `----------------------------------------------\n`;
      content += `Name:          ${project.name}\n`;
      content += `Contribution:  ${project.contribution}\n`;
      content += `Status:        ${project.status}\n\n`;
    });

    content += `==============================================\n`;
    content += `           END OF REPORT\n`;
    content += `==============================================\n`;
    
    return content;
  };

  const downloadTXT = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">My Reports</h1>
        </div>
        
        <p className="text-sm opacity-90">Track your performance and project contributions</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Report Type</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Performance</SelectItem>
                    <SelectItem value="project">Project Reports</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedCategory === "attendance" ? (
                <div>
                  <Label htmlFor="report-date" className="text-sm text-gray-600 mb-2 block">
                    Report Date
                  </Label>
                  <Input
                    id="report-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Time Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedCategory === "attendance" ? (
          /* Attendance Report */
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-h3 text-black">Attendance Report</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Selected Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    This report will include your work hours, start time, lunch breaks, and end time for the selected date.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Report Contents</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Agent name and report date</li>
                        <li>• Start time (check-in)</li>
                        <li>• Lunch start and end times</li>
                        <li>• End time (check-out)</li>
                        <li>• Total hours worked</li>
                        <li>• Work hours vs lunch duration</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : selectedCategory === "personal" ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <BarChart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xl font-bold text-black">{personalData.totalActivities}</p>
                  <p className="text-xs text-gray-600">Total Activities</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xl font-bold text-black">{personalData.averageDailyPoints}</p>
                  <p className="text-xs text-gray-600">Avg Daily Points</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 text-center">
                  <PieChart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-xl font-bold text-black">{personalData.successRate}%</p>
                  <p className="text-xs text-gray-600">Success Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Breakdown */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-h3 mb-4 text-black">Activity Breakdown</h3>
                
                <div className="space-y-3">
                  {personalData.activityBreakdown.map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      onClick={() => {
                        const route = activity.type === 'Sales' ? '/sales-activities' : 
                                     activity.type === 'Surveys' ? '/survey-activities' : 
                                     '/giveaway-activities';
                        navigate(route);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${activity.color}`}></div>
                        <span className="text-black">{activity.type}</span>
                      </div>
                      <Badge variant="secondary">{activity.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Project Reports */
          <div className="space-y-4">
            {projectData.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-black">{project.name}</h3>
                    <Badge 
                      variant={project.status === "Active" ? "default" : "secondary"}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{project.contribution}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notes Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Report Notes</h3>
            <Textarea
              placeholder="Add any additional notes or observations about this report..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Image Upload Section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-h3 mb-4 text-black">Attach Images</h3>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={preview} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <label htmlFor="image-upload">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload images</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
              </div>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </CardContent>
        </Card>

        {/* Export Button */}
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={handleExportReport}
          disabled={isExporting}
        >
          <Download size={20} className="mr-2" />
          {isExporting ? "Generating..." : 
           selectedCategory === "attendance" ? "Download Attendance Report" : "Export Report"}
        </Button>
      </div>
    </MobileLayout>
  );
};