import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart, PieChart, TrendingUp, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("this-week");
  const [selectedCategory, setSelectedCategory] = useState("personal");
  const [isExporting, setIsExporting] = useState(false);

  // Mock report data
  const personalData = {
    totalActivities: 23,
    averageDailyPoints: 45,
    successRate: 87,
    activityBreakdown: [
      { type: "Sales", count: 8, color: "bg-green-500" },
      { type: "Surveys", count: 12, color: "bg-blue-500" },
      { type: "Giveaways", count: 3, color: "bg-purple-500" }
    ]
  };

  const projectData = [
    {
      id: "1",
      name: "Solar Energy Initiative",
      contribution: "15 surveys completed",
      status: "Active"
    },
    {
      id: "2", 
      name: "LED Distribution Campaign",
      contribution: "8 product demonstrations",
      status: "Completed"
    }
  ];

  const handleExportReport = async () => {
    if (!user) {
      toast.error("Please sign in to export reports");
      return;
    }

    setIsExporting(true);

    try {
      // Save report to Supabase
      const reportMetrics = selectedCategory === "personal" 
        ? {
            totalActivities: personalData.totalActivities,
            averageDailyPoints: personalData.averageDailyPoints,
            successRate: personalData.successRate,
            activityBreakdown: personalData.activityBreakdown
          }
        : {
            projects: projectData
          };

      const { data, error } = await supabase
        .from('reports')
        .insert({
          agent_id: user.id,
          report_type: selectedCategory,
          period: selectedPeriod,
          metrics: reportMetrics
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Report saved and exported successfully!");
      
      // Optional: Download CSV or PDF file
      const csvContent = selectedCategory === "personal" 
        ? generatePersonalReportCSV(personalData)
        : generateProjectReportCSV(projectData);
      
      downloadCSV(csvContent, `${selectedCategory}-report-${selectedPeriod}.csv`);

    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const generatePersonalReportCSV = (data: typeof personalData) => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Activities", data.totalActivities.toString()],
      ["Average Daily Points", data.averageDailyPoints.toString()],
      ["Success Rate", `${data.successRate}%`],
      ["", ""], // Empty row
      ["Activity Type", "Count"],
      ...data.activityBreakdown.map(activity => [activity.type, activity.count.toString()])
    ];
    
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const generateProjectReportCSV = (data: typeof projectData) => {
    const headers = ["Project Name", "Contribution", "Status"];
    const rows = data.map(project => [
      project.name,
      project.contribution,
      project.status
    ]);
    
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
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
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Time Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCategory === "personal" ? (
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
                    <div key={index} className="flex items-center justify-between">
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

        {/* Export Button */}
        <Button 
          className="w-full" 
          variant="outline" 
          onClick={handleExportReport}
          disabled={isExporting}
        >
          <Download size={20} className="mr-2" />
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>
    </MobileLayout>
  );
};