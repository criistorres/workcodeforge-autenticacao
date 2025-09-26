import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { sqliteDb } from './utils/sqlite-database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Carregar variáveis de ambiente PRIMEIRO
dotenv.config();

// Importar rotas DEPOIS do dotenv
console.log('🔧 Importando rotas de teste...');
import testRoutes from './routes/test';
console.log('✅ Rotas de teste importadas:', typeof testRoutes);

console.log('🔧 Importando rotas de autenticação...');
import authRoutes from './routes/auth';
console.log('✅ Rotas de autenticação importadas:', typeof authRoutes);

console.log('🔧 Importando rotas OIDC...');
import oidcRoutes from './routes/oidc';
console.log('✅ Rotas OIDC importadas:', typeof oidcRoutes);

console.log('🔧 Importando rotas de métricas...');
import metricsRoutes from './routes/metrics';
console.log('✅ Rotas de métricas importadas:', typeof metricsRoutes);
// import { metricsMiddleware } from './monitoring/metrics';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Middleware de segurança
app.use(helmet({
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

// Middleware CORS
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de cookies
app.use(cookieParser());

// Middleware de métricas
// app.use(metricsMiddleware);

// Servir arquivos estáticos da interface
app.use(express.static('public'));

// Middleware de logging
app.use((req, _res, next) => {
  logger.info('Requisição recebida', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rota de health check
app.get('/health', async (_req, res) => {
  try {
    // Testar conexão com banco de dados
    const isDbConnected = await sqliteDb.testConnection();
    
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
  } catch (error) {
    logger.error('Erro no health check:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Rota de informações da API
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

// Rota de teste simples para debug
app.get('/debug/test', (_req, res) => {
  res.json({ success: true, message: 'Debug endpoint funcionando' });
});

app.post('/debug/test', (req, res) => {
  res.json({ success: true, message: 'Debug POST funcionando', body: req.body });
});

// Rotas de teste
app.use('/test', testRoutes);

// Rotas de autenticação
app.use('/auth', authRoutes);

// Rotas OIDC
app.use('/', oidcRoutes);

// Rotas de métricas
app.use('/metrics', metricsRoutes);

// Rotas da interface de usuário
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

// Middleware para rotas não encontradas
app.use('*', notFoundHandler);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Função para executar migrações
async function runMigrations() {
  try {
    logger.info('Executando migrações do banco de dados...');
    
    // Inicializar banco de dados primeiro
    await sqliteDb.initialize();
    
    // Verificar se a tabela users existe
    const usersExists = await sqliteDb.tableExists('users');
    
    if (!usersExists) {
      logger.info('Tabela users não encontrada, executando migrações...');
      
      // Executar migração da tabela users
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
      
      await sqliteDb.runMigration(createUsersTable);
      
      // Criar índices
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
        'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)'
      ];
      
      for (const index of indexes) {
        await sqliteDb.runMigration(index);
      }
      
      logger.info('✅ Migrações executadas com sucesso');
    } else {
      logger.info('✅ Tabela users já existe, pulando migrações');
    }
  } catch (error) {
    logger.error('Erro ao executar migrações:', error);
    throw error;
  }
}

// Função para inicializar o servidor
async function startServer() {
  try {
    // Inicializar banco de dados primeiro
    await sqliteDb.initialize();
    logger.info('✅ Banco de dados inicializado');
    
    // Executar migrações
    await runMigrations();
    
    // Testar conexão com banco de dados
    const isDbConnected = await sqliteDb.testConnection();
    if (!isDbConnected) {
      throw new Error('Falha na conexão com banco de dados');
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado na porta ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Info: http://localhost:${PORT}/api/info`);
      logger.info(`🌍 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info('✅ Conexão com banco de dados estabelecida');
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais de encerramento
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  await sqliteDb.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  await sqliteDb.close();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', { reason, promise });
  process.exit(1);
});

// Inicializar servidor sempre que o módulo for carregado
console.log('🚀 Iniciando servidor...');
startServer();

export default app;
