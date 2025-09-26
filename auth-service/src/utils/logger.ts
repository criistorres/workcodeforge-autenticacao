import * as winston from 'winston';
import * as path from 'path';

// Configuração do logger
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Configuração para desenvolvimento
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Criar logger
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: process.env['NODE_ENV'] === 'production' ? logFormat : developmentFormat,
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env['NODE_ENV'] === 'production' ? logFormat : developmentFormat
    }),
    
    // File transport para erros
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport para todos os logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Configuração de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],
  
  // Configuração de rejeições não tratadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

// Se não estiver em produção, também logar no console
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(new winston.transports.Console({
    format: developmentFormat
  }));
}

export default logger;
