import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
