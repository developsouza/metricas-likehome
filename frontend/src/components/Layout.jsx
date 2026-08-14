import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";
import NotificationBell from "./Notificacoes/NotificationBell";
import { useAuth } from "../contexts/AuthContext";

const titles = {
    "/dashboard": "Dashboard",
    "/bi": "Análise BI",
    "/pipeline": "Pipeline de Unidades",
    "/empreendimentos": "Empreendimentos",
    "/unidades/checkup": "Unidades / Checkup",
    "/unidades": "Unidades",
    "/lancamentos": "Lançamento de Indicadores",
    "/indicadores": "Indicadores",
    "/usuarios": "Usuários",
    "/analise-gestao": "Análise / Gestão",
};

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem("lh-theme") || "light");
    const location = useLocation();
    const { usuario } = useAuth();
    const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] || "Métricas LikeHome";

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("lh-theme", theme);
    }, [theme]);

    return (
        <div className="app-layout">
            {/* Overlay para fechar sidebar no mobile */}
            <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-content">
                <header className="topbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Abrir menu">
                            <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="topbar-heading">
                            <span className="topbar-eyebrow">Workspace</span>
                            <span className="topbar-title">{title}</span>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-date">
                            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <button className="icon-button theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={`Ativar tema ${theme === "dark" ? "claro" : "escuro"}`} title="Alternar tema">
                            {theme === "dark" ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
                            )}
                        </button>
                        <NotificationBell />
                        <div className="topbar-profile" title={usuario?.nome}>
                            <span>{usuario?.nome?.split(" ").slice(0, 2).map((n) => n[0]).join("") || "LH"}</span>
                        </div>
                    </div>
                </header>
                <div className="page-body">{children}</div>
            </div>
        </div>
    );
}
