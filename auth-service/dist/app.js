"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const sqlite_database_1 = require("./utils/sqlite-database");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
console.log('🔧 Importando rotas de teste...');
const test_1 = __importDefault(require("./routes/test"));
console.log('✅ Rotas de teste importadas:', typeof test_1.default);
console.log('🔧 Importando rotas de autenticação...');
const auth_1 = __importDefault(require("./routes/auth"));
console.log('✅ Rotas de autenticação importadas:', typeof auth_1.default);
console.log('🔧 Importando rotas OIDC...');
const oidc_1 = __importDefault(require("./routes/oidc"));
console.log('✅ Rotas OIDC importadas:', typeof oidc_1.default);
console.log('🔧 Importando rotas de métricas...');
const metrics_1 = __importDefault(require("./routes/metrics"));
console.log('✅ Rotas de métricas importadas:', typeof metrics_1.default);
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3000;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static('public'));
app.use((req, _res, next) => {
    logger_1.logger.info('Requisição recebida', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
app.get('/health', async (_req, res) => {
    try {
        const isDbConnected = await sqlite_database_1.sqliteDb.testConnection();
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env['NODE_ENV'],
            database: isDbConnected ? 'connected' : 'disconnected',
            version: process.env['npm_package_version'] || '1.0.0'
        };
        const statusCode = isDbConnected ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        logger_1.logger.error('Erro no health check:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable'
        });
    }
});
app.get('/api/info', (_req, res) => {
    res.json({
        name: 'Auth Service',
        version: '1.0.0',
        description: 'Sistema de Login Dinâmico para WorkAdventure',
        endpoints: {
            health: '/health',
            info: '/api/info',
            auth: '/auth/*',
            oidc: {
                discovery: '/.well-known/openid-configuration',
                authorize: '/oauth/authorize',
                token: '/oauth/token',
                userinfo: '/oauth/userinfo',
                jwks: '/oauth/jwks'
            }
        },
        documentation: 'https://github.com/workcodeforge/auth-service'
    });
});
app.get('/debug/test', (_req, res) => {
    res.json({ success: true, message: 'Debug endpoint funcionando' });
});
app.post('/debug/test', (req, res) => {
    res.json({ success: true, message: 'Debug POST funcionando', body: req.body });
});
app.use('/test', test_1.default);
app.use('/auth', auth_1.default);
app.use('/', oidc_1.default);
app.use('/metrics', metrics_1.default);
app.get('/', (_req, res) => {
    res.redirect('/login.html');
});
app.get('/login', (_req, res) => {
    res.redirect('/login.html');
});
app.get('/register', (_req, res) => {
    res.redirect('/register.html');
});
app.get('/profile', (_req, res) => {
    res.redirect('/profile.html');
});
app.use('*', errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
async function runMigrations() {
    try {
        logger_1.logger.info('Executando migrações do banco de dados...');
        await sqlite_database_1.sqliteDb.initialize();
        const usersExists = await sqlite_database_1.sqliteDb.tableExists('users');
        if (!usersExists) {
            logger_1.logger.info('Tabela users não encontrada, executando migrações...');
            const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          tags TEXT DEFAULT '[]',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login_at DATETIME
        )
      `;
            await sqlite_database_1.sqliteDb.runMigration(createUsersTable);
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
                'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
                'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)'
            ];
            for (const index of indexes) {
                await sqlite_database_1.sqliteDb.runMigration(index);
            }
            logger_1.logger.info('✅ Migrações executadas com sucesso');
        }
        else {
            logger_1.logger.info('✅ Tabela users já existe, pulando migrações');
        }
    }
    catch (error) {
        logger_1.logger.error('Erro ao executar migrações:', error);
        throw error;
    }
}
async function startServer() {
    try {
        await sqlite_database_1.sqliteDb.initialize();
        logger_1.logger.info('✅ Banco de dados inicializado');
        await runMigrations();
        const isDbConnected = await sqlite_database_1.sqliteDb.testConnection();
        if (!isDbConnected) {
            throw new Error('Falha na conexão com banco de dados');
        }
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Servidor iniciado na porta ${PORT}`);
            logger_1.logger.info(`📊 Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`📚 API Info: http://localhost:${PORT}/api/info`);
            logger_1.logger.info(`🌍 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
            logger_1.logger.info('✅ Conexão com banco de dados estabelecida');
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM recebido, encerrando servidor...');
    await sqlite_database_1.sqliteDb.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT recebido, encerrando servidor...');
    await sqlite_database_1.sqliteDb.close();
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Exceção não capturada:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Promise rejeitada não tratada:', { reason, promise });
    process.exit(1);
});
console.log('🚀 Iniciando servidor...');
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map