import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";

const Login = lazy(() => import("./pages/auth/Login"));
const DashboardAdmin = lazy(() => import("./pages/dashboard/DashboardAdmin"));
const DashboardDepto = lazy(() => import("./pages/dashboard/DashboardDepto"));
const BI = lazy(() => import("./pages/dashboard/BI"));
const Pipeline = lazy(() => import("./pages/pipeline/Pipeline"));
const Lancamentos = lazy(() => import("./pages/lancamentos/Lancamentos"));
const Empreendimentos = lazy(() => import("./pages/admin/Empreendimentos"));
const Indicadores = lazy(() => import("./pages/admin/Indicadores"));
const Usuarios = lazy(() => import("./pages/admin/Usuarios"));
const Unidades = lazy(() => import("./pages/admin/Unidades"));
const Proprietarios = lazy(() => import("./pages/admin/Proprietarios"));
const Importacao = lazy(() => import("./pages/importacao/Importacao"));
const AcompanhamentoSetores = lazy(() => import("./pages/AnaliseGestao/AcompanhamentoSetores"));
const Checkup = lazy(() => import("./pages/checkup/Checkup"));

function LoadingScreen() {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)", background: "var(--page)" }}>Carregando...</div>;
}

function PrivateRoute({ children, adminOnly = false, roles }) {
    const { usuario, loading } = useAuth();
    if (loading)
        return <LoadingScreen />;
    if (!usuario) return <Navigate to="/login" replace />;
    if (adminOnly && usuario.perfil !== "admin") return <Navigate to="/dashboard" replace />;
    if (roles && !roles.includes(usuario.perfil)) return <Navigate to="/dashboard" replace />;
    return children;
}

function DashboardRoute() {
    const { usuario } = useAuth();
    if (usuario?.perfil === "analise_gestao") return <Navigate to="/bi" replace />;
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
                    <PrivateRoute roles={["admin", "analise_gestao"]}>
                        <Layout>
                            <BI />
                        </Layout>
                    </PrivateRoute>
                }
            />
            <Route path="/analise-gestao" element={<PrivateRoute><Layout><AcompanhamentoSetores /></Layout></PrivateRoute>} />
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
            <Route path="/unidades/checkup" element={<PrivateRoute><Layout><Checkup /></Layout></PrivateRoute>} />
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
                <Suspense fallback={<LoadingScreen />}>
                    <AppRoutes />
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}
