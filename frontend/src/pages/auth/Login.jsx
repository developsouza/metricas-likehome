import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import logoLikeHome from "../../assets/logolikesvg.svg";
import simboloLikeHome from "../../assets/logosemnome.png";
import heroLikeHome from "../../assets/hero.png";

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
    const [showPassword, setShowPassword] = useState(false);
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
                    <img className="login-brand-logo" src={logoLikeHome} alt="LikeHome Intelligence" />
                    <img className="login-hero-art" src={heroLikeHome} alt="" aria-hidden="true" />
                    <div className="login-kicker">Inteligência para hospitalidade</div>
                    <h1 className="login-brand-title">Decisões melhores começam com uma visão mais clara.</h1>
                    <p className="login-brand-sub">Indicadores, operação e estratégia conectados em um só lugar.</p>
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
                            <img src={simboloLikeHome} alt="LikeHome" />
                        </div>
                        <span className="login-form-kicker">Área segura</span>
                        <h2>Bem-vindo de volta</h2>
                        <p>Entre para acessar seu workspace LikeHome.</p>
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
                            <div className="password-field">
                            <input
                                className="form-control"
                                type={showPassword ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button>
                            </div>
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
