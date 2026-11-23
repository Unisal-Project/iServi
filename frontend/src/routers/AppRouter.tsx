import { useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import Login from "@/pages/admin/Login";
import ResetPassword from "@/pages/admin/ResetPassword";
import { getSession } from "@/services/auth.service";
import { adminHome, canAccessAdminPath } from "./admin-access";
import { AdminRoutes } from "./AdminRoutes";
import { ClientRoutes } from "./ClientRoutes";

function LoginRoute() {
  const navigate = useNavigate();
  const session = getSession();
  if (session) return <Navigate to={adminHome(session.user.role)} replace />;
  return <Login onEnter={() => navigate(adminHome(getSession()?.user.role), { replace: true })} />;
}

function ResetPasswordRoute() {
  const navigate = useNavigate();
  return <ResetPassword onBack={() => navigate("/login", { replace: true })} />;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (!canAccessAdminPath(session.user.role, pathname)) {
    return <Navigate to={adminHome(session.user.role)} replace />;
  }
  return children;
}

function EntryRoute() {
  const { search } = useLocation();
  return (
    <Navigate
      to={
        new URLSearchParams(search).has("mesa")
          ? { pathname: "/cardapio", search }
          : "/login"
      }
      replace
    />
  );
}

function ScrollToTop() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    // O card já posiciona o foco e a rolagem no painel de detalhes.
    if (state?.preserveScroll) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, state]);
  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<EntryRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/redefinir-senha" element={<ResetPasswordRoute />} />
        <Route path="/admin/*" element={<RequireAuth><AdminRoutes /></RequireAuth>} />
        <Route path="/*" element={<ClientRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
