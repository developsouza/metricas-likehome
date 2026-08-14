const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { initDatabase } = require("./database");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errors");
const { isProduction, port, allowedOrigins } = require("./config");
const { normalizarEstrutura } = require("./utils/textEncoding");

const app = express();
app.disable("x-powered-by");

// Cabeçalhos de segurança
app.use(
    helmet({
        contentSecurityPolicy: isProduction,
        crossOriginEmbedderPolicy: isProduction,
    }),
);

// CORS — em produção restringe ao domínio configurado
const corsOptions = {
    origin(origin, callback) {
        if (!isProduction || !origin || allowedOrigins.includes(origin)) return callback(null, true);
        const error = new Error("Origem não permitida pelo CORS");
        error.status = 403;
        callback(error);
    },
    credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
    if (req.body) req.body = normalizarEstrutura(req.body);
    next();
});

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

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`🚀 Métricas LikeHome API rodando na porta ${port} [${process.env.NODE_ENV || "development"}]`);
});

function shutdown(signal) {
    console.log(`${signal} recebido; encerrando conexões.`);
    server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = { app, server };
