require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
    const message = "JWT_SECRET deve existir e ter pelo menos 32 caracteres";
    if (isProduction) throw new Error(message);
    console.warn(`[config] ${message}. Use um segredo forte antes de publicar.`);
}

module.exports = {
    isProduction,
    port: Number(process.env.PORT) || 3001,
    jwtSecret: jwtSecret || "development-only-secret-change-me-now",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    allowedOrigins: (process.env.ALLOWED_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
};
