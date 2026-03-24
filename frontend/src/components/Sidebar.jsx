import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { labelDepto } from "../utils/format";

const IconDash = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
    </svg>
);
const IconChart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
    </svg>
);
const IconBuilding = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
    </svg>
);
const IconUnits = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
    </svg>
);
const IconKpi = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const IconUsers = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
    </svg>
);
const IconBI = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
);
const IconLogout = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
    </svg>
);
const IconPipeline = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
    </svg>
);
const IconOwner = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export default function Sidebar({ isOpen, onClose }) {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = usuario?.perfil === "admin";

    function go(path) {
        navigate(path);
        onClose?.();
    }
    function isActive(path) {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    }

    return (
        <aside className={`sidebar${isOpen ? " open" : ""}`}>
            <div className="sidebar-brand">
                <h1>📊 Métricas LikeHome</h1>
                <span>Gestão de Indicadores</span>
            </div>

            <nav className="sidebar-nav">
                {isAdmin ? (
                    <>
                        <div className="nav-section">Visão Geral</div>
                        <button className={`nav-item ${isActive("/dashboard") ? "active" : ""}`} onClick={() => go("/dashboard")}>
                            <IconDash /> Dashboard Admin
                        </button>
                        <button className={`nav-item ${isActive("/bi") ? "active" : ""}`} onClick={() => go("/bi")}>
                            <IconBI /> Análise BI
                        </button>

                        <div className="nav-section">Operacional</div>
                        <button className={`nav-item ${isActive("/pipeline") ? "active" : ""}`} onClick={() => go("/pipeline")}>
                            <IconPipeline /> Pipeline de Unidades
                        </button>
                        <button className={`nav-item ${isActive("/empreendimentos") ? "active" : ""}`} onClick={() => go("/empreendimentos")}>
                            <IconBuilding /> Empreendimentos
                        </button>
                        <button className={`nav-item ${isActive("/unidades") ? "active" : ""}`} onClick={() => go("/unidades")}>
                            <IconUnits /> Unidades
                        </button>
                        <button className={`nav-item ${isActive("/proprietarios") ? "active" : ""}`} onClick={() => go("/proprietarios")}>
                            <IconOwner /> Proprietários
                        </button>

                        <div className="nav-section">Indicadores</div>
                        <button className={`nav-item ${isActive("/lancamentos") ? "active" : ""}`} onClick={() => go("/lancamentos")}>
                            <IconKpi /> Lançamentos
                        </button>
                        <button className={`nav-item ${isActive("/indicadores") ? "active" : ""}`} onClick={() => go("/indicadores")}>
                            <IconChart /> Indicadores
                        </button>

                        <div className="nav-section">Administração</div>
                        <button className={`nav-item ${isActive("/usuarios") ? "active" : ""}`} onClick={() => go("/usuarios")}>
                            <IconUsers /> Usuários
                        </button>
                    </>
                ) : (
                    <>
                        <div className="nav-section">Meu Departamento</div>
                        <button className={`nav-item ${isActive("/dashboard") ? "active" : ""}`} onClick={() => go("/dashboard")}>
                            <IconDash /> Dashboard
                        </button>
                        <button className={`nav-item ${isActive("/lancamentos") ? "active" : ""}`} onClick={() => go("/lancamentos")}>
                            <IconKpi /> Lançar Indicadores
                        </button>
                        <div className="nav-section">Consulta</div>
                        <button className={`nav-item ${isActive("/pipeline") ? "active" : ""}`} onClick={() => go("/pipeline")}>
                            <IconPipeline /> Pipeline de Unidades
                        </button>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <strong>{usuario?.nome}</strong>
                    {labelDepto(usuario?.departamento)} · {usuario?.perfil}
                </div>
                <button className="nav-item" style={{ marginTop: 8, color: "rgba(255,255,255,.5)" }} onClick={logout}>
                    <IconLogout /> Sair
                </button>
            </div>
        </aside>
    );
}
