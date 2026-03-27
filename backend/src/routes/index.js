const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth");
const auth = require("../controllers/authController");
const usuarios = require("../controllers/usuariosController");
const empreendimentos = require("../controllers/empreendimentosController");
const proprietarios = require("../controllers/proprietariosController");
const unidades = require("../controllers/unidadesController");
const indicadores = require("../controllers/indicadoresController");
const lancamentos = require("../controllers/lancamentosController");
const dashboard = require("../controllers/dashboardController");
const importCtrl = require("../controllers/importController");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        } else {
            cb(new Error("Apenas arquivos CSV são permitidos"));
        }
    },
});

// Auth
router.post("/auth/login", auth.login);
router.get("/auth/me", authMiddleware, auth.me);

// Dashboard
router.get("/dashboard/admin", authMiddleware, adminMiddleware, dashboard.dashboardAdmin);
router.get("/dashboard/departamento/:depto", authMiddleware, dashboard.dashboardDepartamento);
router.get("/dashboard/bi", authMiddleware, adminMiddleware, dashboard.bi);

// Usuários (admin)
router.get("/usuarios", authMiddleware, adminMiddleware, usuarios.listar);
router.get("/usuarios/:id", authMiddleware, adminMiddleware, usuarios.buscar);
router.post("/usuarios", authMiddleware, adminMiddleware, usuarios.criar);
router.put("/usuarios/:id", authMiddleware, adminMiddleware, usuarios.atualizar);
router.delete("/usuarios/:id", authMiddleware, adminMiddleware, usuarios.remover);

// Empreendimentos
router.get("/empreendimentos", authMiddleware, empreendimentos.listar);
router.get("/empreendimentos/:id", authMiddleware, empreendimentos.buscar);
router.post("/empreendimentos", authMiddleware, adminMiddleware, empreendimentos.criar);
router.put("/empreendimentos/:id", authMiddleware, adminMiddleware, empreendimentos.atualizar);
router.delete("/empreendimentos/:id", authMiddleware, adminMiddleware, empreendimentos.remover);

// Proprietários
router.get("/proprietarios", authMiddleware, proprietarios.listar);
router.post("/proprietarios", authMiddleware, adminMiddleware, proprietarios.criar);
router.put("/proprietarios/:id", authMiddleware, adminMiddleware, proprietarios.atualizar);
router.delete("/proprietarios/:id", authMiddleware, adminMiddleware, proprietarios.remover);

// Unidades
router.get("/unidades", authMiddleware, unidades.listar);
router.get("/unidades/pipeline/resumo", authMiddleware, unidades.resumoPipeline);
router.get("/unidades/:id", authMiddleware, unidades.buscar);
router.post("/unidades", authMiddleware, adminMiddleware, unidades.criar);
router.put("/unidades/:id", authMiddleware, unidades.atualizar);
router.delete("/unidades/:id", authMiddleware, adminMiddleware, unidades.remover);

// Indicadores
router.get("/indicadores", authMiddleware, indicadores.listar);
router.post("/indicadores", authMiddleware, adminMiddleware, indicadores.criar);
router.put("/indicadores/:id", authMiddleware, adminMiddleware, indicadores.atualizar);

// Lançamentos
router.get("/lancamentos", authMiddleware, lancamentos.listar);
router.get("/lancamentos/historico", authMiddleware, lancamentos.historico);
router.post("/lancamentos", authMiddleware, lancamentos.criar);
router.put("/lancamentos/:id", authMiddleware, lancamentos.atualizar);
router.delete("/lancamentos/:id", authMiddleware, lancamentos.remover);

// Importação CSV
router.post("/import/validar", authMiddleware, adminMiddleware, upload.single("arquivo"), importCtrl.validar);
router.post("/import/importar", authMiddleware, adminMiddleware, upload.single("arquivo"), importCtrl.importar);
router.get("/import/modelo-lancamentos", authMiddleware, adminMiddleware, importCtrl.modeloLancamentos);

module.exports = router;
