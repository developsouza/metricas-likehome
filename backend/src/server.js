require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { initDatabase } = require("./database");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Cabeçalhos de segurança
app.use(
    helmet({
        contentSecurityPolicy: isProduction,
        crossOriginEmbedderPolicy: isProduction,
    }),
);

// CORS — em produção restringe ao domínio configurado
const corsOptions = {
    origin: isProduction ? process.env.ALLOWED_ORIGIN || false : "*",
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Inicializa banco
initDatabase();

// Health check (antes das rotas estáticas)
app.get("/health", (req, res) => res.json({ status: "ok", app: "Métricas LikeHome API", env: process.env.NODE_ENV }));

// Rotas da API
app.use("/api", routes);

// Em produção serve o build do frontend
if (isProduction) {
    const frontendDist = path.resolve(__dirname, "../../frontend/dist");
    app.use(express.static(frontendDist));
    app.get("*", (req, res) => {
        res.sendFile(path.join(frontendDist, "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Métricas LikeHome API rodando na porta ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
