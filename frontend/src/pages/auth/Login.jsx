import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const IconChart = () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width={28} height={28}>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
    </svg>
);

const features = [
    { icon: "📊", text: "Dashboard de KRIs e KPIs em tempo real" },
    { icon: "🏠", text: "Pipeline de unidades e empreendimentos" },
    { icon: "📈", text: "Análise BI com séries temporais" },
    { icon: "🎯", text: "Metas por departamento e competência" },
];

export default function Login() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);
        try {
            await login(email, senha);
            navigate("/dashboard");
        } catch {
            setErro("Email ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            {/* Painel esquerdo — branding */}
            <div className="login-left">
                <div className="login-left-content">
                    <div className="login-brand-icon">
                        <IconChart />
                    </div>
                    <h1 className="login-brand-title">Métricas LikeHome</h1>
                    <p className="login-brand-sub">Plataforma de gestão e acompanhamento de indicadores estratégicos para short stay.</p>
                    <ul className="login-features">
                        {features.map((f, i) => (
                            <li key={i}>
                                <span className="login-feature-icon">{f.icon}</span>
                                <span>{f.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="login-left-deco" aria-hidden="true" />
                <div className="login-left-deco2" aria-hidden="true" />
            </div>

            {/* Painel direito — formulário */}
            <div className="login-right">
                <div className="login-form-wrap">
                    <div className="login-form-header">
                        <div className="login-logo-mobile">
                            <IconChart />
                        </div>
                        <h2>Bem-vindo de volta</h2>
                        <p>Acesse sua conta para continuar</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {erro && (
                            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                                {erro}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input
                                className="form-control"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Senha</label>
                            <input
                                className="form-control"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ width: "100%", justifyContent: "center", padding: "12px 16px", marginTop: 8, fontSize: 14 }}
                        >
                            {loading ? "Entrando..." : "Entrar na plataforma"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
