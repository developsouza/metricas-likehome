/**
 * Componente de paginação reutilizável.
 * Uso:
 *   const [pagina, setPagina] = useState(1)
 *   const POR_PAGINA = 20
 *   const totalPaginas = Math.ceil(lista.length / POR_PAGINA)
 *   const slice = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
 *   <Paginacao pagina={pagina} totalPaginas={totalPaginas} total={lista.length} porPagina={POR_PAGINA} onChange={setPagina} />
 */
export default function Paginacao({ pagina, totalPaginas, total, porPagina, onChange }) {
    if (!total || totalPaginas <= 1) return null;

    const ini = (pagina - 1) * porPagina + 1;
    const fim = Math.min(pagina * porPagina, total);

    function gerarPaginas() {
        if (totalPaginas <= 7) {
            return Array.from({ length: totalPaginas }, (_, i) => i + 1);
        }
        const arr = [1];
        if (pagina > 3) arr.push(null);
        for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) {
            arr.push(i);
        }
        if (pagina < totalPaginas - 2) arr.push(null);
        arr.push(totalPaginas);
        return arr;
    }

    function ir(p) {
        if (p < 1 || p > totalPaginas) return;
        onChange(p);
    }

    return (
        <div className="paginacao">
            <span className="paginacao-info">
                {ini}–{fim} de {total} registro{total !== 1 ? "s" : ""}
            </span>
            <div className="paginacao-btns">
                <button className="paginacao-btn" onClick={() => ir(1)} disabled={pagina === 1} title="Primeira">
                    «
                </button>
                <button className="paginacao-btn" onClick={() => ir(pagina - 1)} disabled={pagina === 1} title="Anterior">
                    ‹
                </button>
                {gerarPaginas().map((p, i) =>
                    p === null ? (
                        <span key={`e${i}`} className="paginacao-ellipsis">
                            …
                        </span>
                    ) : (
                        <button key={p} className={`paginacao-btn${p === pagina ? " active" : ""}`} onClick={() => ir(p)}>
                            {p}
                        </button>
                    ),
                )}
                <button className="paginacao-btn" onClick={() => ir(pagina + 1)} disabled={pagina === totalPaginas} title="Próxima">
                    ›
                </button>
                <button className="paginacao-btn" onClick={() => ir(totalPaginas)} disabled={pagina === totalPaginas} title="Última">
                    »
                </button>
            </div>
        </div>
    );
}
