// Catalog of TraKKiT mobile components that projects can toggle.
// Stable `code` is the key persisted in project_plans.mobile_components,
// which is denormalized into user_workspaces.active_components at sign-in.
// Mirrors the catalog in the trakkit project-creation wizard.

export type MobileComponentGroup =
  | 'agent-action'
  | 'agent-page'
  | 'supervisor-page'
  | 'card'
  | 'layout';

export interface MobileComponent {
  code: string;
  name: string;
  path: string;
  group: MobileComponentGroup;
  description: string;
}

export const MOBILE_COMPONENTS: MobileComponent[] = [
  // ---------- AGENT ACTIONS ----------
  { code: 'CRM-0010', name: 'Check-in / Check-out', path: 'src/components/dashboard/CheckInOutDialog.tsx', group: 'agent-action', description: 'Lets agents check in and out of a store visit with location capture.' },
  { code: 'CRM-0034', name: 'Record Sale', path: 'src/components/dashboard/SalesTrackingForm.tsx', group: 'agent-action', description: 'Capture units sold and amounts per product during a visit.' },
  { code: 'CRM-0034G', name: 'Give Products', path: 'src/pages/GiveProducts.tsx', group: 'agent-action', description: 'Record promotional giveaways or samples handed to customers.' },
  { code: 'CRM-0097', name: 'Take Survey', path: 'src/pages/Surveys.tsx', group: 'agent-action', description: 'Run assigned surveys and submit responses from the field.' },
  { code: 'CRM-0096', name: 'Log Interaction', path: 'src/pages/LogInteraction.tsx', group: 'agent-action', description: 'Log a customer engagement, feedback or note.' },
  { code: 'CRM-0019', name: 'Evening Report', path: 'src/components/attendance/EveningReportDialog.tsx', group: 'agent-action', description: 'End-of-day summary submitted by the agent.' },
  { code: 'CRM-0020', name: 'Closing Report', path: 'src/components/attendance/InstoreClosingReportDialog.tsx', group: 'agent-action', description: 'In-store closing report capturing day totals and notes.' },
  { code: 'CRM-0021', name: 'Morning Stock Count', path: 'src/components/attendance/InstoreMorningStockCountDialog.tsx', group: 'agent-action', description: 'Opening stock check at the start of an in-store shift.' },
  { code: 'CRM-0022', name: 'Stock Report', path: 'src/components/attendance/StockReportDialog.tsx', group: 'agent-action', description: 'Submit a stock-on-hand report for a store.' },
  { code: 'CRM-0023', name: 'Survey Closing Report', path: 'src/components/attendance/SurveyClosingReportDialog.tsx', group: 'agent-action', description: 'End-of-day report for survey-only projects.' },
  { code: 'CRM-0024', name: 'Seeding Evening Report', path: 'src/components/attendance/SeedingEveningReportDialog.tsx', group: 'agent-action', description: 'Evening report variant for product-seeding projects.' },
  { code: 'CRM-0025', name: 'Price Report', path: 'src/components/attendance/PriceReportDialog.tsx', group: 'agent-action', description: 'Capture competitor or shelf prices observed in store.' },
  { code: 'CRM-0026', name: 'Record Attendance', path: 'src/components/attendance/RecordAttendanceForm.tsx', group: 'agent-action', description: 'Selfie + geo attendance check-in for the workday.' },
  { code: 'CRM-0030', name: 'Engagement', path: 'src/components/EngagementModal.tsx', group: 'agent-action', description: 'Quick customer engagement capture (demo, taste, pitch).' },

  // ---------- AGENT PAGES ----------
  { code: 'CRM-0089', name: 'Dashboard', path: 'src/pages/Dashboard.tsx', group: 'agent-page', description: 'Agent home with KPIs, schedule and quick actions.' },
  { code: 'CRM-0090', name: 'Profile', path: 'src/pages/Profile.tsx', group: 'agent-page', description: 'Agent profile, summaries and settings.' },
  { code: 'CRM-0091', name: 'Activity', path: 'src/pages/Activity.tsx', group: 'agent-page', description: "Feed of the agent's recorded activity." },
  { code: 'CRM-0092', name: 'Activity Detail', path: 'src/pages/ActivityDetail.tsx', group: 'agent-page', description: 'Drill-down view for a single activity record.' },
  { code: 'CRM-0093', name: 'Inventory', path: 'src/pages/Inventory.tsx', group: 'agent-page', description: 'Assigned stock items the agent carries.' },
  { code: 'CRM-0094', name: 'Record Sale Page', path: 'src/pages/RecordSale.tsx', group: 'agent-page', description: 'Full-page sale recording flow.' },
  { code: 'CRM-0095', name: 'Give Products Page', path: 'src/pages/GiveProducts.tsx', group: 'agent-page', description: 'Full-page giveaway recording flow.' },
  { code: 'CRM-0098', name: 'Routes', path: 'src/pages/Routes.tsx', group: 'agent-page', description: 'Planned route and stops for the day.' },
  { code: 'CRM-0099', name: 'Reports', path: 'src/pages/Reports.tsx', group: 'agent-page', description: 'Reports the agent has submitted or needs to submit.' },
  { code: 'CRM-0100', name: 'More', path: 'src/pages/More.tsx', group: 'agent-page', description: 'Overflow menu of less common pages.' },
  { code: 'CRM-0101', name: 'Settings', path: 'src/pages/Settings.tsx', group: 'agent-page', description: 'Mobile app settings.' },
  { code: 'CRM-0105', name: 'Interaction History', path: 'src/pages/InteractionHistory.tsx', group: 'agent-page', description: 'Past customer interactions log.' },
  { code: 'CRM-0106', name: 'Sales Activity List', path: 'src/pages/SalesActivityList.tsx', group: 'agent-page', description: 'Detailed list of recorded sales.' },
  { code: 'CRM-0107', name: 'Giveaway Activity List', path: 'src/pages/GiveawayActivityList.tsx', group: 'agent-page', description: 'Detailed list of giveaways.' },
  { code: 'CRM-0108', name: 'Survey Activity List', path: 'src/pages/SurveyActivityList.tsx', group: 'agent-page', description: 'Detailed list of completed surveys.' },
  { code: 'CRM-0109', name: 'Help & Support', path: 'src/pages/HelpSupport.tsx', group: 'agent-page', description: 'Help articles and contact options.' },
  { code: 'CRM-0110', name: 'Support Ticket', path: 'src/pages/SupportTicket.tsx', group: 'agent-page', description: 'Submit and track support tickets.' },
  { code: 'CRM-0111', name: 'Manage Agents', path: 'src/pages/ManageAgents.tsx', group: 'agent-page', description: 'Lead-agent tools for managing peers.' },

  // ---------- SUPERVISOR PAGES ----------
  { code: 'CRM-0118', name: 'Supervisor Dashboard', path: 'src/pages/SupervisorDashboard.tsx', group: 'supervisor-page', description: 'Realtime supervisor overview of the workspace.' },
  { code: 'CRM-0119', name: 'Feedback', path: 'src/pages/supervisor/FeedbackPage.tsx', group: 'supervisor-page', description: 'Customer feedback aggregation across agents.' },
  { code: 'CRM-0120', name: 'Gallery', path: 'src/pages/supervisor/GalleryPage.tsx', group: 'supervisor-page', description: 'Photo gallery from agent submissions.' },
  { code: 'CRM-0121', name: 'Sales', path: 'src/pages/supervisor/SalesPage.tsx', group: 'supervisor-page', description: 'Sales overview for supervisors.' },
  { code: 'CRM-0122', name: 'Rankings', path: 'src/pages/supervisor/RankingsPage.tsx', group: 'supervisor-page', description: 'Agent leaderboard rankings.' },
  { code: 'CRM-0123', name: 'Users', path: 'src/pages/supervisor/UsersPage.tsx', group: 'supervisor-page', description: 'Workspace user management page.' },
  { code: 'CRM-0124', name: 'Stats', path: 'src/pages/supervisor/StatsPage.tsx', group: 'supervisor-page', description: 'Workspace performance stats.' },
  { code: 'CRM-0125', name: 'Map', path: 'src/pages/supervisor/MapPage.tsx', group: 'supervisor-page', description: 'Live agent locations on a map.' },
  { code: 'CRM-0126', name: 'Inbox', path: 'src/pages/supervisor/InboxPage.tsx', group: 'supervisor-page', description: 'Supervisor inbox and messages.' },
  { code: 'CRM-0130', name: 'Giveaways Tab', path: 'src/components/supervisor/MobileGiveawaysTab.tsx', group: 'supervisor-page', description: 'Supervisor giveaways tab.' },

  // ---------- CARDS / WIDGETS ----------
  { code: 'CRM-0050', name: 'Top Bar', path: 'src/components/dashboard/TopBar.tsx', group: 'card', description: 'Top bar with workspace switcher and notifications.' },
  { code: 'CRM-0051', name: 'Quick Actions', path: 'src/components/dashboard/QuickActions.tsx', group: 'card', description: 'Grid of one-tap actions on the dashboard.' },
  { code: 'CRM-0052', name: 'Upcoming Schedule', path: 'src/components/dashboard/UpcomingSchedule.tsx', group: 'card', description: 'List of upcoming visits/tasks on the dashboard.' },
  { code: 'CRM-0053', name: 'Work Hours', path: 'src/components/attendance/WorkHoursCard.tsx', group: 'card', description: "Today's clocked work hours card." },
  { code: 'CRM-0054', name: 'Sale Feedback', path: 'src/components/dashboard/SaleFeedbackDialog.tsx', group: 'card', description: 'Prompt for customer feedback right after a sale.' },
  { code: 'CRM-0055', name: 'Store Success Dialog', path: 'src/components/StoreSuccessDialog.tsx', group: 'card', description: 'Confirmation shown after a successful store action.' },
  { code: 'CRM-0060', name: 'Activity Card', path: 'src/components/supervisor/ActivityCard.tsx', group: 'card', description: 'Card summarising a recent agent activity.' },
  { code: 'CRM-0061', name: 'Agent Status Item', path: 'src/components/supervisor/AgentStatusItem.tsx', group: 'card', description: 'Live agent status row used in supervisor lists.' },
  { code: 'CRM-0062', name: 'Check-in Thumbnail', path: 'src/components/supervisor/CheckInThumbnail.tsx', group: 'card', description: 'Thumbnail preview of an agent check-in photo.' },
  { code: 'CRM-0063', name: 'Daily Summary', path: 'src/components/profile/DailySummaryCard.tsx', group: 'card', description: "Per-day summary of the agent's totals." },
  { code: 'CRM-0064', name: 'Weekly Summary', path: 'src/components/profile/WeeklySummaryCard.tsx', group: 'card', description: 'Rolling weekly summary card.' },

  // ---------- LAYOUT / GLOBAL ----------
  { code: 'CRM-0001', name: 'Bottom Navigation', path: 'src/components/BottomNavigation.tsx', group: 'layout', description: 'Bottom tab bar for agent navigation.' },
  { code: 'CRM-0002', name: 'Supervisor Bottom Nav', path: 'src/components/supervisor/SupervisorBottomNav.tsx', group: 'layout', description: 'Bottom tab bar for supervisor mode.' },
  { code: 'CRM-0003', name: 'Status Bar', path: 'src/components/StatusBar.tsx', group: 'layout', description: 'In-app status bar (sync, connectivity).' },
  { code: 'CRM-0004', name: 'PWA Install Prompt', path: 'src/components/PWAInstallPrompt.tsx', group: 'layout', description: 'Prompt encouraging install to home screen.' },
  { code: 'CRM-0005', name: 'Background Location Tracker', path: 'src/components/BackgroundLocationTracker.tsx', group: 'layout', description: 'Background GPS tracker for agent location.' },
];

// Default = every component enabled. Sparse jsonb in active_components
// only stores overrides, so missing keys resolve to `true`.
export const DEFAULT_MOBILE_COMPONENTS: Record<string, boolean> = Object.fromEntries(
  MOBILE_COMPONENTS.map((c) => [c.code, true]),
);

export const mergeWithDefaults = (
  stored: Record<string, boolean | string> | null | undefined,
): Record<string, boolean | string> => ({
  ...DEFAULT_MOBILE_COMPONENTS,
  ...(stored ?? {}),
});

export const componentByCode = (code: string) =>
  MOBILE_COMPONENTS.find((c) => c.code === code);
