function notFound(req, res) {
    res.status(404).json({ error: "Recurso não encontrado" });
}

function errorHandler(error, _req, res, _next) {
    const status = error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
    const knownClientError = status < 500 || error.name === "MulterError";
    if (!knownClientError) console.error(error);
    res.status(status).json({
        error: knownClientError ? error.message : "Erro interno do servidor",
    });
}

module.exports = { notFound, errorHandler };
