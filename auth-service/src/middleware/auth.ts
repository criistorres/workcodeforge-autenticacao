import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/JWTService';

// Interface para dados do usuário no request
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    name: string;
    username: string;
    tags: string[];
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    scope: string;
  };
}

/**
 * Middleware para autenticação JWT
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
      return;
    }

    const jwtService = new JWTService();
    const decoded = jwtService.verifyToken(token);
    
    // Adicionar dados do usuário ao request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Token inválido'
    });
  }
}

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const jwtService = new JWTService();
      const decoded = jwtService.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Se houver erro, continua sem usuário autenticado
    next();
  }
}

/**
 * Middleware para verificar se usuário tem escopo específico
 */
export function requireScope(scope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida'
      });
      return;
    }

    const userScopes = req.user.scope.split(' ');
    if (!userScopes.includes(scope)) {
      res.status(403).json({
        success: false,
        message: `Escopo '${scope}' requerido`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware para verificar se usuário tem tag específica
 */
export function requireTag(tag: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticação requerida'
      });
      return;
    }

    if (!req.user.tags.includes(tag)) {
      res.status(403).json({
        success: false,
        message: `Tag '${tag}' requerida`
      });
      return;
    }

    next();
  };
}
