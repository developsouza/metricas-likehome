import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/auth/Login";
import DashboardAdmin from "./pages/dashboard/DashboardAdmin";
import DashboardDepto from "./pages/dashboard/DashboardDepto";
import BI from "./pages/dashboard/BI";
import Pipeline from "./pages/pipeline/Pipeline";
import Lancamentos from "./pages/lancamentos/Lancamentos";
import Empreendimentos from "./pages/admin/Empreendimentos";
import Indicadores from "./pages/admin/Indicadores";
import Usuarios from "./pages/admin/Usuarios";
import Unidades from "./pages/admin/Unidades";
import Proprietarios from "./pages/admin/Proprietarios";

function PrivateRoute({ children, adminOnly = false }) {
    const { usuario, loading } = useAuth();
    if (loading)
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#64748b" }}>Carregando...</div>
        );
    if (!usuario) return <Navigate to="/login" replace />;
    if (adminOnly && usuario.perfil !== "admin") return <Navigate to="/dashboard" replace />;
    return children;
}

function DashboardRoute() {
    const { usuario } = useAuth();
    return usuario?.perfil === "admin" ? <DashboardAdmin /> : <DashboardDepto />;
}

function AppRoutes() {
    const { usuario } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={usuario ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <Layout>
                            <DashboardRoute />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/bi"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <BI />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/pipeline"
                element={
                    <PrivateRoute>
                        <Layout>
                            <Pipeline />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/lancamentos"
                element={
                    <PrivateRoute>
                        <Layout>
                            <Lancamentos />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/empreendimentos"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Empreendimentos />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/proprietarios"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Proprietarios />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/unidades"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Unidades />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/indicadores"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Indicadores />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/usuarios"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Usuarios />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/importacao"
                element={
                    <PrivateRoute adminOnly>
                        <Layout>
                            <Importacao />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
