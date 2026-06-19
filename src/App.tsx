import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import { UiVariantProvider } from "@/contexts/UiVariantContext";
import { useUiVariant } from "@/contexts/UiVariantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import IcMemoPage from "./pages/IcMemoPage";
import CommentsPage from "./pages/CommentsPage";
import ProjectChrome from "./pages/ProjectChrome";
import { GpShell } from "@/components/gp/GpShell";
import { ModeRedirector } from "@/components/gp/ModeRedirector";
import GpChat from "./pages/gp/GpChat";
import RaisesList from "./pages/gp/RaisesList";
import RaiseContext from "./pages/gp/RaiseContext";
import RaiseOverview from "./pages/gp/raise/RaiseOverview";
import RaiseDataroom from "./pages/gp/raise/RaiseDataroom";
import RaiseDdq from "./pages/gp/raise/RaiseDdq";
import RaiseInterview from "./pages/gp/raise/RaiseInterview";
import RaiseReportCard from "./pages/gp/raise/RaiseReportCard";
import RaiseFeedback from "./pages/gp/raise/RaiseFeedback";
import RaisePipeline from "./pages/gp/raise/RaisePipeline";
import Pipeline from "./pages/gp/Pipeline";
import Contacts from "./pages/gp/Contacts";
import GpSettings from "./pages/gp/GpSettings";

const queryClient = new QueryClient();

function RoleRoutes() {
  const { variant } = useUiVariant();
  if (variant === "gp") {
    return (
      <Routes>
        <Route element={<GpShell />}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<GpChat />} />
          <Route path="/raises" element={<RaisesList />} />
          <Route path="/raises/:fundId" element={<RaiseContext />}>
            <Route index element={<RaiseOverview />} />
            <Route path="dataroom" element={<RaiseDataroom />} />
            <Route path="ddq" element={<RaiseDdq />} />
            <Route path="interview" element={<RaiseInterview />} />
            <Route path="report-card" element={<RaiseReportCard />} />
            <Route path="feedback" element={<RaiseFeedback />} />
            <Route path="pipeline" element={<RaisePipeline />} />
          </Route>
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/settings" element={<GpSettings />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Route>
      </Routes>
    );
  }
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:id" element={<ProjectChrome />}>
          <Route index element={<ProjectDetail />} />
          <Route path="memo" element={<IcMemoPage />} />
          <Route path="comments" element={<CommentsPage />} />
        </Route>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={800} skipDelayDuration={300}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UiVariantProvider>
        <ChatProvider>
          <ModeRedirector />
          <RoleRoutes />
        </ChatProvider>
        </UiVariantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
