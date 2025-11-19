import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Dashboard } from "./pages/Dashboard";
import { AgentDashboard } from "./pages/AgentDashboard";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";
import { SupervisorMore } from "./pages/SupervisorMore";
import { Surveys } from "./pages/Surveys";
import { Routes as RoutesPage } from "./pages/Routes";
import { Inventory } from "./pages/Inventory";
import { More } from "./pages/More";
import { Login } from "./pages/Login";
import { RecordSale } from "./pages/RecordSale";
import { GiveProducts } from "./pages/GiveProducts";
import { LogInteraction } from "./pages/LogInteraction";
import { InteractionHistory } from "./pages/InteractionHistory";
import { Profile } from "./pages/Profile";
import { Reports } from "./pages/Reports";
import { Documentation } from "./pages/Documentation";
import { Settings } from "./pages/Settings";
import { HelpSupport } from "./pages/HelpSupport";
import { DebugKit } from "./pages/DebugKit";
import { ManageAgents } from "./pages/ManageAgents";
import { SalesActivityList } from "./pages/SalesActivityList";
import { SurveyActivityList } from "./pages/SurveyActivityList";
import { GiveawayActivityList } from "./pages/GiveawayActivityList";
import { ActivityDetail } from "./pages/ActivityDetail";
import { Activity } from "./pages/Activity";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAUpdateNotification from "./components/PWAUpdateNotification";
import NotFound from "./pages/NotFound";
import { AgentTracking } from "./pages/supervisor/AgentTracking";
import { DailyPlanApproval } from "./pages/supervisor/DailyPlanApproval";
import { InventoryManagement } from "./pages/supervisor/InventoryManagement";
import { IncidentReporting } from "./pages/supervisor/IncidentReporting";
import { ReportsAnalytics } from "./pages/supervisor/ReportsAnalytics";
import { Planning } from "./pages/supervisor/Planning";
import { ProjectDetails } from "./pages/supervisor/ProjectDetails";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <InstallPrompt />
          <PWAInstallPrompt />
          <PWAUpdateNotification />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SupervisorDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/agent" element={
              <RoleBasedRoute allowedRoles={['agent']} redirectTo="/">
                <AgentDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/surveys" element={
              <ProtectedRoute>
                <Surveys />
              </ProtectedRoute>
            } />
            <Route path="/routes" element={
              <ProtectedRoute>
                <RoutesPage />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/more" element={
              <ProtectedRoute>
                <More />
              </ProtectedRoute>
            } />
            <Route path="/record-sale" element={
              <ProtectedRoute>
                <RecordSale />
              </ProtectedRoute>
            } />
            <Route path="/give-products" element={
              <ProtectedRoute>
                <GiveProducts />
              </ProtectedRoute>
            } />
            <Route path="/log-interaction" element={
              <ProtectedRoute>
                <LogInteraction />
              </ProtectedRoute>
            } />
            <Route path="/interaction-history" element={
              <ProtectedRoute>
                <InteractionHistory />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/documentation" element={
              <ProtectedRoute>
                <Documentation />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/help-support" element={
              <ProtectedRoute>
                <HelpSupport />
              </ProtectedRoute>
            } />
            <Route path="/debug-kit" element={
              <ProtectedRoute>
                <DebugKit />
              </ProtectedRoute>
            } />
            <Route path="/manage-agents" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <ManageAgents />
              </RoleBasedRoute>
            } />
            <Route path="/sales-activities" element={
              <ProtectedRoute>
                <SalesActivityList />
              </ProtectedRoute>
            } />
            <Route path="/survey-activities" element={
              <ProtectedRoute>
                <SurveyActivityList />
              </ProtectedRoute>
            } />
            <Route path="/giveaway-activities" element={
              <ProtectedRoute>
                <GiveawayActivityList />
              </ProtectedRoute>
            } />
            <Route path="/activity-detail/:activityId" element={
              <ProtectedRoute>
                <ActivityDetail />
              </ProtectedRoute>
            } />
            <Route path="/activity" element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            } />
            <Route path="/supervisor/agent-tracking" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <AgentTracking />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/daily-plan-approval" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <DailyPlanApproval />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/inventory-management" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <InventoryManagement />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/incident-reporting" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <IncidentReporting />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/reports-analytics" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <ReportsAnalytics />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/planning" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <Planning />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/project-details/:projectId" element={
              <RoleBasedRoute allowedRoles={['supervisor']}>
                <ProjectDetails />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor-dashboard" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SupervisorDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor-more" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SupervisorMore />
              </RoleBasedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
