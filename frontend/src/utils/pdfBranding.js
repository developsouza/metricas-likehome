import logoLikeHome from "../assets/logosemnome.png";

export const BRAND_RGB = [244, 75, 99];
const BRAND_DARK_RGB = [185, 47, 71];

let logoPromise;

export function carregarLogoPdf() {
  if (!logoPromise) {
    logoPromise = fetch(logoLikeHome)
      .then((response) => response.blob())
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }
  return logoPromise;
}

export function adicionarCabecalhoPdf(doc, titulo, logo) {
  const largura = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND_RGB);
  doc.rect(0, 0, largura, 32, "F");
  doc.setFillColor(...BRAND_DARK_RGB);
  doc.rect(0, 30, largura, 2, "F");
  if (logo) doc.addImage(logo, "PNG", 14, 6, 18, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(titulo, 38, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("LIKEHOME INTELLIGENCE", 38, 22);
  doc.setTextColor(30, 41, 59);
}

export function adicionarRodapesPdf(doc) {
  const paginas = doc.getNumberOfPages();
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(244, 75, 99);
    doc.setLineWidth(.35);
    doc.line(14, altura - 12, largura - 14, altura - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("LikeHome Intelligence", 14, altura - 7);
    doc.text(`Página ${pagina} de ${paginas}`, largura - 14, altura - 7, { align: "right" });
  }
  doc.setTextColor(30, 41, 59);
}
