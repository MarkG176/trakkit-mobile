import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { AgentStatusProvider } from "@/hooks/useAgentStatus";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { ProjectComponentGate } from "./components/ProjectComponentGate";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { TourOverlay } from "./components/onboarding/TourOverlay";
import { PermissionRequestProvider } from "./components/PermissionRequestProvider";

// Route-level code splitting: each page is loaded on demand so the initial
// bundle (login / first paint) no longer pays the parse cost of every screen.
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard").then((m) => ({ default: m.AgentDashboard })));
const SupervisorDashboard = lazy(() => import("./pages/SupervisorDashboard").then((m) => ({ default: m.SupervisorDashboard })));
const UsersPage = lazy(() => import("./pages/supervisor/UsersPage").then((m) => ({ default: m.UsersPage })));
const SalesPage = lazy(() => import("./pages/supervisor/SalesPage").then((m) => ({ default: m.SalesPage })));
const GalleryPage = lazy(() => import("./pages/supervisor/GalleryPage").then((m) => ({ default: m.GalleryPage })));
const RankingsPage = lazy(() => import("./pages/supervisor/RankingsPage").then((m) => ({ default: m.RankingsPage })));
const FeedbackPage = lazy(() => import("./pages/supervisor/FeedbackPage").then((m) => ({ default: m.FeedbackPage })));
const InboxPage = lazy(() => import("./pages/supervisor/InboxPage").then((m) => ({ default: m.InboxPage })));
const StatsPage = lazy(() => import("./pages/supervisor/StatsPage").then((m) => ({ default: m.StatsPage })));
const MapPage = lazy(() => import("./pages/supervisor/MapPage").then((m) => ({ default: m.MapPage })));
const SupportTicket = lazy(() => import("./pages/SupportTicket").then((m) => ({ default: m.SupportTicket })));
const Surveys = lazy(() => import("./pages/Surveys").then((m) => ({ default: m.Surveys })));
const RoutesPage = lazy(() => import("./pages/Routes").then((m) => ({ default: m.Routes })));
const Inventory = lazy(() => import("./pages/Inventory").then((m) => ({ default: m.Inventory })));
const More = lazy(() => import("./pages/More").then((m) => ({ default: m.More })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const RecordSale = lazy(() => import("./pages/RecordSale").then((m) => ({ default: m.RecordSale })));
const GiveProducts = lazy(() => import("./pages/GiveProducts").then((m) => ({ default: m.GiveProducts })));
const LogInteraction = lazy(() => import("./pages/LogInteraction").then((m) => ({ default: m.LogInteraction })));
const InteractionHistory = lazy(() => import("./pages/InteractionHistory").then((m) => ({ default: m.InteractionHistory })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));
const Reports = lazy(() => import("./pages/Reports").then((m) => ({ default: m.Reports })));
const Documentation = lazy(() => import("./pages/Documentation").then((m) => ({ default: m.Documentation })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const HelpSupport = lazy(() => import("./pages/HelpSupport").then((m) => ({ default: m.HelpSupport })));
const DebugKit = lazy(() => import("./pages/DebugKit").then((m) => ({ default: m.DebugKit })));
const ManageAgents = lazy(() => import("./pages/ManageAgents").then((m) => ({ default: m.ManageAgents })));
const SalesActivityList = lazy(() => import("./pages/SalesActivityList").then((m) => ({ default: m.SalesActivityList })));
const SurveyActivityList = lazy(() => import("./pages/SurveyActivityList").then((m) => ({ default: m.SurveyActivityList })));
const GiveawayActivityList = lazy(() => import("./pages/GiveawayActivityList").then((m) => ({ default: m.GiveawayActivityList })));
const ActivityDetail = lazy(() => import("./pages/ActivityDetail").then((m) => ({ default: m.ActivityDetail })));
const Activity = lazy(() => import("./pages/Activity").then((m) => ({ default: m.Activity })));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile-friendly defaults: cache results, avoid refetch storms on
      // every window focus / remount that previously hit Supabase repeatedly.
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceProvider>
        <AgentStatusProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PermissionRequestProvider>
                <PWAInstallPrompt />
                <TourOverlay />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SupervisorDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SupervisorDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/users" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <UsersPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/sales" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <SalesPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/gallery" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <GalleryPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/rankings" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <RankingsPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/feedback" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <FeedbackPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/inbox" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <InboxPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/stats" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <StatsPage />
              </RoleBasedRoute>
            } />
            <Route path="/supervisor/map" element={
              <RoleBasedRoute allowedRoles={['supervisor']} redirectTo="/agent">
                <MapPage />
              </RoleBasedRoute>
            } />
            <Route path="/agent" element={
              <RoleBasedRoute allowedRoles={['agent']} redirectTo="/supervisor">
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
                <ProjectComponentGate code="CRM-0097">
                  <Surveys />
                </ProjectComponentGate>
              </ProtectedRoute>
            } />
            <Route path="/routes" element={
              <ProtectedRoute>
                <ProjectComponentGate code="CRM-0098">
                  <RoutesPage />
                </ProjectComponentGate>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <ProjectComponentGate code="CRM-0093">
                  <Inventory />
                </ProjectComponentGate>
              </ProtectedRoute>
            } />
            <Route path="/more" element={
              <ProtectedRoute>
                <More />
              </ProtectedRoute>
            } />
            <Route path="/record-sale" element={
              <ProtectedRoute>
                <ProjectComponentGate code="CRM-0094">
                  <RecordSale />
                </ProjectComponentGate>
              </ProtectedRoute>
            } />
            <Route path="/give-products" element={
              <ProtectedRoute>
                <ProjectComponentGate code="CRM-0095">
                  <GiveProducts />
                </ProjectComponentGate>
              </ProtectedRoute>
            } />
            <Route path="/log-interaction" element={
              <ProtectedRoute>
                <ProjectComponentGate code="CRM-0096">
                  <LogInteraction />
                </ProjectComponentGate>
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
                <RouteErrorBoundary pageName="Reports">
                  <ProjectComponentGate code="CRM-0099">
                    <Reports />
                  </ProjectComponentGate>
                </RouteErrorBoundary>
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
            <Route path="/support-ticket" element={
              <ProtectedRoute>
                <SupportTicket />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
              </PermissionRequestProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
        </AgentStatusProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
