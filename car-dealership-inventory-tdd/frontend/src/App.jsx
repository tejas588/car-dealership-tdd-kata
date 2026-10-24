import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";

function Protected({ admin = false, children }) {
  const { user } = useAuth();
  if (!user || !localStorage.getItem("torque_token"))
    return <Navigate to="/login" replace />;
  if (admin && user.role !== "ADMIN")
    return <Navigate to="/vehicles" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route
          path="/admin"
          element={
            <Protected admin>
              <AdminPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/vehicles" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
