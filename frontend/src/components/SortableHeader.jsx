export default function SortableHeader({ label, field, sortField, sortDirection, onSort, style }) {
    const active = sortField === field;
    const direction = active ? (sortDirection === "asc" ? "▲" : "▼") : "⇅";

    return (
        <th
            onClick={() => onSort(field)}
            style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", ...style }}
            aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
        >
            {label}
            <span aria-hidden="true" style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: "0.75em" }}>
                {direction}
            </span>
        </th>
    );
}
