import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface StockReport {
  id: string;
  product_variant_id: string;
  stock_level: 'available' | 'low_stock' | 'unavailable';
  report_type: 'morning' | 'evening';
  reported_at: string;
  product_name?: string;
}

export const StockReportsCard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('stock_reports')
          .select(`
            id,
            product_variant_id,
            stock_level,
            report_type,
            reported_at,
            product_variants (name)
          `)
          .eq('agent_id', user.id)
          .gte('reported_at', `${today}T00:00:00`)
          .order('reported_at', { ascending: false });

        if (error) throw error;

        const transformedReports = (data || []).map(report => ({
          id: report.id,
          product_variant_id: report.product_variant_id,
          stock_level: report.stock_level as 'available' | 'low_stock' | 'unavailable',
          report_type: report.report_type as 'morning' | 'evening',
          reported_at: report.reported_at,
          product_name: (report.product_variants as any)?.name || 'Unknown Product',
        }));

        setReports(transformedReports);
      } catch (error) {
        console.error("Error fetching stock reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const getStockLevelBadge = (level: string) => {
    switch (level) {
      case 'available':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low Stock
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Unavailable
          </Badge>
        );
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const morningReports = reports.filter(r => r.report_type === 'morning');
  const eveningReports = reports.filter(r => r.report_type === 'evening');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Package className="h-5 w-5" />
            Today's Stock Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading stock reports...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Package className="h-5 w-5" />
          Today's Stock Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No stock reports submitted today
          </p>
        ) : (
          <>
            {morningReports.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Morning Report
                </h4>
                <div className="space-y-2">
                  {morningReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                      <span className="text-sm">{report.product_name}</span>
                      {getStockLevelBadge(report.stock_level)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {eveningReports.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Evening Report
                </h4>
                <div className="space-y-2">
                  {eveningReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                      <span className="text-sm">{report.product_name}</span>
                      {getStockLevelBadge(report.stock_level)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
