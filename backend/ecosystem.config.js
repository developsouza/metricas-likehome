module.exports = {
    apps: [
        {
            name: "metricas-likehome-api",
            script: "src/server.js",
            instances: 1,
            exec_mode: "fork",
            watch: false,
            env_production: {
                NODE_ENV: "production",
                PORT: 3001,
            },
            // Reiniciar automaticamente se consumir mais de 500MB
            max_memory_restart: "500M",
            // Logs
            error_file: "/var/log/metricas-likehome/error.log",
            out_file: "/var/log/metricas-likehome/out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            // Reiniciar se ficar fora do ar
            autorestart: true,
            restart_delay: 3000,
        },
    ],
};
