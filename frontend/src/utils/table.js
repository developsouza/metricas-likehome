import { useMemo, useState } from "react";

function comparar(a, b) {
    if (a == null || a === "") return b == null || b === "" ? 0 : 1;
    if (b == null || b === "") return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
}

function valorDoCampo(item, campo) {
    return campo.split(".").reduce((valor, chave) => valor?.[chave], item);
}

export function useOrdenacao(items, initialField = "") {
    const [ordenacao, setOrdenacao] = useState(initialField);
    const [direcao, setDirecao] = useState("asc");

    function toggleOrdem(campo) {
        if (ordenacao === campo) setDirecao((valor) => (valor === "asc" ? "desc" : "asc"));
        else {
            setOrdenacao(campo);
            setDirecao("asc");
        }
    }

    const itensOrdenados = useMemo(() => {
        if (!ordenacao) return items;
        return [...items].sort((a, b) => {
            const resultado = comparar(valorDoCampo(a, ordenacao), valorDoCampo(b, ordenacao));
            return direcao === "asc" ? resultado : -resultado;
        });
    }, [items, ordenacao, direcao]);

    return { itensOrdenados, ordenacao, direcao, toggleOrdem };
}
