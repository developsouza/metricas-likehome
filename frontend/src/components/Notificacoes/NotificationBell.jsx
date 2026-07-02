import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const POLLING_MS = Number(import.meta.env.VITE_NOTIFICATIONS_POLLING_MS) || 30000;

export default function NotificationBell() {
  const [dados, setDados] = useState({ notificacoes: [], nao_lidas: 0 });
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const carregar = useCallback(async () => {
    try { setDados((await api.get("/notificacoes?limite=20")).data); } catch { /* polling volta a tentar */ }
  }, []);

  useEffect(() => {
    const inicial = setTimeout(carregar, 0);
    const timer = setInterval(carregar, POLLING_MS);
    return () => { clearTimeout(inicial); clearInterval(timer); };
  }, [carregar]);
  useEffect(() => {
    const fechar = (e) => !ref.current?.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  async function abrirNotificacao(n) {
    if (!n.lida) await api.put(`/notificacoes/${n.id}/lida`);
    setAberto(false); carregar();
    if (n.referencia_tipo === "atividade") navigate(`/analise-gestao?atividade=${n.referencia_id}`);
  }
  async function marcarTodas() { await api.put("/notificacoes/marcar-todas-lidas"); carregar(); }

  return (
    <div className="notification-wrap" ref={ref}>
      <button className="notification-bell" onClick={() => setAberto((v) => !v)} aria-label="Notificações">
        🔔{dados.nao_lidas > 0 && <span>{dados.nao_lidas > 99 ? "99+" : dados.nao_lidas}</span>}
      </button>
      {aberto && <div className="notification-dropdown">
        <div className="notification-head"><strong>Notificações</strong>{dados.nao_lidas > 0 && <button onClick={marcarTodas}>Marcar todas como lidas</button>}</div>
        <div className="notification-list">
          {!dados.notificacoes.length && <div className="notification-empty">Nenhuma notificação.</div>}
          {dados.notificacoes.map((n) => <button key={n.id} className={`notification-item${n.lida ? "" : " unread"}`} onClick={() => abrirNotificacao(n)}>
            <strong>{n.titulo}</strong><span>{n.mensagem}</span><small>{new Date(`${n.criado_em}Z`).toLocaleString("pt-BR")}</small>
          </button>)}
        </div>
      </div>}
    </div>
  );
}
