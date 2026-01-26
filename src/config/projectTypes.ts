export type ProjectType = 
  | 'sales_activation'      // Focus: Sales + Giveaways
  | 'survey_campaign'       // Focus: Surveys only
  | 'brand_activation'      // Focus: All features
  | 'door_to_door'          // Focus: Sales + Surveys + Interactions
  | 'sampling'              // Focus: Giveaways only
  | 'instore'               // Focus: In-store activations with assigned locations
  | 'wholesale'             // Focus: Inventory without quantity, no routes, no daily sales
  | 'hybrid';               // All features enabled (default)

export interface QuickActionFeatures {
  recordSale: boolean;
  giveProducts: boolean;
  startSurvey: boolean;
  logInteraction: boolean;
}

export interface PageFeatures {
  surveys: boolean;
  inventory: boolean;
  routes: boolean;
  reports: boolean;
}

export interface RoutesFeatures {
  showAssignedLocation: boolean;
  showAddLocation: boolean;
}

export interface ReportFeatures {
  showDailySales: boolean;
  showStockReports: boolean;
}

export interface InventoryFeatures {
  showQuantity: boolean;
}

export interface AttendanceFeatures {
  showStockReportOnCheckIn: boolean;
  showStockReportOnCheckOut: boolean;
}

export interface MetricFeatures {
  showSalesTarget: boolean;
  showSurveyCount: boolean;
  showTasksToday: boolean;
}

export interface ProjectFeatureConfig {
  quickActions: QuickActionFeatures;
  pages: PageFeatures;
  metrics: MetricFeatures;
  reports: ReportFeatures;
  inventory: InventoryFeatures;
  attendance: AttendanceFeatures;
  routes: RoutesFeatures;
}

export const PROJECT_TYPE_FEATURES: Record<ProjectType, ProjectFeatureConfig> = {
  sales_activation: {
    quickActions: { 
      recordSale: true, 
      giveProducts: true, 
      startSurvey: false, 
      logInteraction: true 
    },
    pages: { 
      surveys: false, 
      inventory: true, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: false, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  },
  survey_campaign: {
    quickActions: { 
      recordSale: false, 
      giveProducts: false, 
      startSurvey: true, 
      logInteraction: true 
    },
    pages: { 
      surveys: true, 
      inventory: false, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: false, 
      showSurveyCount: true, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  },
  brand_activation: {
    quickActions: { 
      recordSale: true, 
      giveProducts: true, 
      startSurvey: true, 
      logInteraction: true 
    },
    pages: { 
      surveys: true, 
      inventory: true, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: true, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  },
  door_to_door: {
    quickActions: { 
      recordSale: true, 
      giveProducts: false, 
      startSurvey: true, 
      logInteraction: true 
    },
    pages: { 
      surveys: true, 
      inventory: true, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: true, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: true },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  },
  sampling: {
    quickActions: { 
      recordSale: false, 
      giveProducts: true, 
      startSurvey: false, 
      logInteraction: true 
    },
    pages: { 
      surveys: false, 
      inventory: true, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: false, 
      showSurveyCount: false, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: true },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  },
  instore: {
    quickActions: { 
      recordSale: true, 
      giveProducts: true, 
      startSurvey: false, 
      logInteraction: true 
    },
    pages: { 
      surveys: false, 
      inventory: true, 
      routes: false, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: false, 
      showTasksToday: true 
    },
    reports: { showDailySales: false, showStockReports: true },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: true, showStockReportOnCheckOut: true },
    routes: { showAssignedLocation: true, showAddLocation: false }
  },
  wholesale: {
    quickActions: { 
      recordSale: true, 
      giveProducts: false, 
      startSurvey: false, 
      logInteraction: true 
    },
    pages: { 
      surveys: false, 
      inventory: true, 
      routes: false, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: false, 
      showTasksToday: true 
    },
    reports: { showDailySales: false, showStockReports: true },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: true, showStockReportOnCheckOut: true },
    routes: { showAssignedLocation: true, showAddLocation: false }
  },
  hybrid: {
    quickActions: { 
      recordSale: true, 
      giveProducts: true, 
      startSurvey: true, 
      logInteraction: true 
    },
    pages: { 
      surveys: true, 
      inventory: true, 
      routes: true, 
      reports: true 
    },
    metrics: { 
      showSalesTarget: true, 
      showSurveyCount: true, 
      showTasksToday: true 
    },
    reports: { showDailySales: true, showStockReports: false },
    inventory: { showQuantity: false },
    attendance: { showStockReportOnCheckIn: false, showStockReportOnCheckOut: false },
    routes: { showAssignedLocation: false, showAddLocation: true }
  }
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  sales_activation: 'Sales Activation',
  survey_campaign: 'Survey Campaign',
  brand_activation: 'Brand Activation',
  door_to_door: 'Door to Door',
  sampling: 'Product Sampling',
  instore: 'In-Store',
  wholesale: 'Wholesale',
  hybrid: 'Hybrid (All Features)'
};

export const DEFAULT_PROJECT_TYPE: ProjectType = 'hybrid';
