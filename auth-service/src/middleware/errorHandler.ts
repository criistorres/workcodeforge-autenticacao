import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Classe para erros customizados da aplicação
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Classe para erros de validação
 */
export class ValidationError extends AppError {
  public readonly errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;

  constructor(errors: Array<{ field: string; message: string; code: string }>) {
    super('Dados inválidos', 400);
    this.errors = errors;
  }
}

/**
 * Classe para erros de negócio
 */
export class BusinessError extends AppError {
  public readonly code: string;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, statusCode);
    this.code = code;
  }
}

/**
 * Middleware de tratamento de erros centralizado
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erro de validação
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
    return;
  }

  // Erro de negócio
  if (error instanceof BusinessError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
    return;
  }

  // Erro da aplicação
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'JSON inválido'
    });
    return;
  }

  // Erro não tratado
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: process.env['NODE_ENV'] === 'production' 
      ? 'Erro interno do servidor' 
      : error.message
  });
}

/**
 * Middleware para capturar rotas não encontradas
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(`Rota ${req.originalUrl} não encontrada`, 404);
  next(error);
}

/**
 * Função para criar erros de validação
 */
export function createValidationError(errors: Array<{ field: string; message: string; code: string }>) {
  return new ValidationError(errors);
}

/**
 * Função para criar erros de negócio
 */
export function createBusinessError(message: string, code: string, statusCode: number = 400) {
  return new BusinessError(message, code, statusCode);
}
