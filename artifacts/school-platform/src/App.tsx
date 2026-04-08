import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Import Pages
import SuperAdminLogin from "./pages/superadmin/login";
import SuperAdminDashboard from "./pages/superadmin/dashboard";
import SchoolAdminLogin from "./pages/admin/login";
import SchoolAdminDashboard from "./pages/admin/dashboard";
import StudentLogin from "./pages/student/login";
import StudentDashboard from "./pages/student/dashboard";
import TeacherLogin from "./pages/teacher/login";
import TeacherDashboard from "./pages/teacher/dashboard";
import TeacherAttendance from "./pages/teacher/attendance";
import PublicSchoolWebsite from "./pages/public/school-website";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Redirect root to student login as a default entry point if not specifying a school
function LandingRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/student/login");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Super Admin Routes */}
      <Route path="/superadmin/login" component={SuperAdminLogin} />
      <Route path="/superadmin" component={SuperAdminDashboard} />

      {/* School Admin Routes */}
      <Route path="/admin/login" component={SchoolAdminLogin} />
      <Route path="/admin" component={SchoolAdminDashboard} />

      {/* Student Routes */}
      <Route path="/student/login" component={StudentLogin} />
      <Route path="/student" component={StudentDashboard} />

      {/* Teacher Routes */}
      <Route path="/teacher/login" component={TeacherLogin} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/teacher/class/:classId/attendance" component={TeacherAttendance} />

      {/* Public School Sites */}
      <Route path="/school/:slug" component={PublicSchoolWebsite} />

      {/* Default/Root */}
      <Route path="/" component={LandingRedirect} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
