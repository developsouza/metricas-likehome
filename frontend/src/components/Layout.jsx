import { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

const titles = {
    "/dashboard": "Dashboard",
    "/bi": "Análise BI",
    "/pipeline": "Pipeline de Unidades",
    "/empreendimentos": "Empreendimentos",
    "/unidades": "Unidades",
    "/lancamentos": "Lançamento de Indicadores",
    "/indicadores": "Indicadores",
    "/usuarios": "Usuários",
};

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const title = Object.entries(titles).find(([k]) => location.pathname.startsWith(k))?.[1] || "Métricas LikeHome";

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
                        <span className="topbar-title">{title}</span>
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-date">
                            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </span>
                    </div>
                </header>
                <div className="page-body">{children}</div>
            </div>
        </div>
    );
}
