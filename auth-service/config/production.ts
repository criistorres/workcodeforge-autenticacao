import { config } from 'dotenv';
import path from 'path';

// Load production environment variables
config({ path: path.join(__dirname, '../.env.production') });

export const productionConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://play.workadventure.localhost',

  // Database
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './data/auth.db',
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./data/auth.db',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET is required in production');
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  // OIDC Configuration
  OIDC_ISSUER: process.env.OIDC_ISSUER || 'http://auth.workadventure.localhost',
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || 'workadventure-client',
  OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || (() => {
    throw new Error('OIDC_CLIENT_SECRET is required in production');
  })(),

  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',

  // Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',

  // Monitoring
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
  METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090', 10),

  // Backup
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_INTERVAL: process.env.BACKUP_INTERVAL || '0 2 * * *', // Daily at 2 AM
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  BACKUP_PATH: process.env.BACKUP_PATH || './backups',

  // SSL/TLS
  SSL_ENABLED: process.env.SSL_ENABLED === 'true',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || './certs/cert.pem',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || './certs/key.pem',

  // Performance
  MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS || '100', 10),
  CONNECTION_TIMEOUT: parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10),
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),

  // Features
  REGISTRATION_ENABLED: process.env.REGISTRATION_ENABLED !== 'false',
  PASSWORD_RESET_ENABLED: process.env.PASSWORD_RESET_ENABLED !== 'false',
  EMAIL_VERIFICATION_ENABLED: process.env.EMAIL_VERIFICATION_ENABLED === 'true',
  TWO_FACTOR_ENABLED: process.env.TWO_FACTOR_ENABLED === 'true',

  // Email (if implemented)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@workadventure.localhost',

  // External Services
  EXTERNAL_AUTH_ENABLED: process.env.EXTERNAL_AUTH_ENABLED === 'true',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
};

export default productionConfig;
