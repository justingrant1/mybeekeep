import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { EquipmentProvider } from './contexts/EquipmentContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ApiaryList from './pages/apiaries/ApiaryList';
import HiveList from './pages/hives/HiveList';
import HiveDetail from './pages/hives/HiveDetail';
import InspectionForm from './pages/inspections/InspectionForm';
import HarvestForm from './pages/harvests/HarvestForm';
import TreatmentForm from './pages/treatments/TreatmentForm';
import EquipmentList from './pages/equipment/EquipmentList';
import PremiumPage from './pages/premium/PremiumPage';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import ApiaryWeather from './pages/weather/ApiaryWeather';
import CalendarView from './components/Calendar/CalendarView';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#f5a623', // Golden honey color
      light: '#ffc853',
      dark: '#c17800',
      contrastText: '#fff',
    },
    secondary: {
      main: '#795548', // Brown wood color
      light: '#a98274',
      dark: '#4b2c20',
      contrastText: '#fff',
    },
    background: {
      default: '#f9f9f9',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Public route wrapper - redirect to dashboard if already logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
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

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apiaries"
        element={
          <ProtectedRoute>
            <ApiaryList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apiaries/:apiaryId"
        element={
          <ProtectedRoute>
            <HiveList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hives/:hiveId"
        element={
          <ProtectedRoute>
            <HiveDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hives/:hiveId/inspections/new"
        element={
          <ProtectedRoute>
            <InspectionForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hives/:hiveId/harvests/new"
        element={
          <ProtectedRoute>
            <HarvestForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hives/:hiveId/treatments/new"
        element={
          <ProtectedRoute>
            <TreatmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipment"
        element={
          <ProtectedRoute>
            <EquipmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/premium"
        element={
          <ProtectedRoute>
            <PremiumPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <ApiaryWeather />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarView />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard or login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch all - 404 */}
      <Route
        path="*"
        element={
          <div>
            <h1>404 - Page Not Found</h1>
          </div>
        }
      />
    </Routes>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    console.log('App component mounted');
    return () => {
      console.log('App component unmounted');
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificationsProvider>
            <EquipmentProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<MainLayout><Outlet /></MainLayout>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="apiaries" element={<ApiaryList />} />
                    <Route path="hives" element={<HiveList />} />
                    <Route path="hives/:id" element={<HiveDetail />} />
                    <Route path="inspections/new" element={<InspectionForm />} />
                    <Route path="inspections/:id" element={<InspectionForm />} />
                    <Route path="harvests/new" element={<HarvestForm />} />
                    <Route path="harvests/:id" element={<HarvestForm />} />
                    <Route path="treatments/new" element={<TreatmentForm />} />
                    <Route path="treatments/:id" element={<TreatmentForm />} />
                    <Route path="equipment" element={<EquipmentList />} />
                    <Route path="premium" element={<PremiumPage />} />
                    <Route path="analytics" element={<AnalyticsDashboard />} />
                    <Route path="weather" element={<ApiaryWeather />} />
                    <Route path="calendar" element={<CalendarView />} />
                  </Route>
                </Routes>
              </Router>
            </EquipmentProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
