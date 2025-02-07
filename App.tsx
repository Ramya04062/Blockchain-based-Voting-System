import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VoterDashboard from "./pages/VoterDashboard";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import Results from "./pages/Results";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkUserType() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Session error:', error);
            setIsLoading(false);
            return;
          }

          setUserType(data?.user_type || null);
        } catch (error) {
          console.error('Error:', error);
        }
      }
      setIsLoading(false);
    }

    checkUserType();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = window.location;
  const isLandingPage = location.pathname === "/" && location.search.includes("landing=true");

  if (user && !isLandingPage) {
    const userType = user.user_metadata?.user_type;
    if (userType === 'voter') {
      return <Navigate to="/voter-dashboard" />;
    } else if (userType === 'organization') {
      return <Navigate to="/organization-dashboard" />;
    }
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider navigate={navigate}>
        <div className="min-h-screen bg-white">
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Index />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/voter-dashboard" 
              element={
                <ProtectedRoute>
                  <VoterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organization-dashboard" 
              element={
                <ProtectedRoute>
                  <OrganizationDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results/:electionId" 
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;