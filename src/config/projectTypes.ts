export type ProjectType = 
  | 'sales_activation'      // Focus: Sales + Giveaways
  | 'survey_campaign'       // Focus: Surveys only
  | 'brand_activation'      // Focus: All features
  | 'door_to_door'          // Focus: Sales + Surveys + Interactions
  | 'sampling'              // Focus: Giveaways only
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

export interface MetricFeatures {
  showSalesTarget: boolean;
  showSurveyCount: boolean;
  showTasksToday: boolean;
}

export interface ProjectFeatureConfig {
  quickActions: QuickActionFeatures;
  pages: PageFeatures;
  metrics: MetricFeatures;
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
    }
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
    }
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
    }
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
    }
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
    }
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
    }
  }
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  sales_activation: 'Sales Activation',
  survey_campaign: 'Survey Campaign',
  brand_activation: 'Brand Activation',
  door_to_door: 'Door to Door',
  sampling: 'Product Sampling',
  hybrid: 'Hybrid (All Features)'
};

export const DEFAULT_PROJECT_TYPE: ProjectType = 'hybrid';
