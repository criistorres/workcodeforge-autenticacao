import { Request, Response } from 'express';
import { UserServiceSQLite } from '../services/UserServiceSQLite';
import { JWTService } from '../services/JWTService';
import { PasswordService } from '../services/PasswordService';
import { 
  RegisterUserSchema, 
  LoginUserSchema, 
  UpdateUserSchema, 
  ChangePasswordSchema 
} from '../schemas/UserSchema';
import { UpdateUserData } from '../models/User';
import { 
  createBusinessError 
} from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  constructor(
    private userService: UserServiceSQLite,
    private jwtService: JWTService,
    private passwordService: PasswordService
  ) {}

  /**
   * POST /auth/register - Registro de usuário
   */
  register = async (req: Request, res: Response) => {
    try {
      logger.info('Tentativa de registro recebida', { body: req.body });
      
      const validatedData = RegisterUserSchema.parse(req.body);
      logger.info('Dados validados com sucesso', { validatedData: { ...validatedData, password: '[HIDDEN]' } });
      
      // Verificar se email já existe
      const existingUserByEmail = await this.userService.findByEmail(validatedData.email);
      if (existingUserByEmail) {
        throw createBusinessError('Email já está em uso', 'EMAIL_ALREADY_EXISTS', 400);
      }

      // Verificar se username já existe
      const existingUserByUsername = await this.userService.findByUsername(validatedData.username);
      if (existingUserByUsername) {
        throw createBusinessError('Username já está em uso', 'USERNAME_ALREADY_EXISTS', 400);
      }

      // Hash da senha
      const passwordHash = await this.passwordService.hashPassword(validatedData.password);

      // Criar usuário
      const { password, ...userDataWithoutPassword } = validatedData;
      const user = await this.userService.create({
        ...userDataWithoutPassword,
        passwordHash
      });

      // Gerar tokens
      const accessToken = this.jwtService.generateAccessToken(user);
      const refreshToken = this.jwtService.generateRefreshToken(user);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        username: user.username
      });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            tags: user.tags,
            createdAt: user.createdAt
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Registration error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * POST /auth/login - Login de usuário
   */
  login = async (req: Request, res: Response) => {
    try {
      const validatedData = LoginUserSchema.parse(req.body);
      
      // Buscar usuário por email
      const user = await this.userService.findByEmail(validatedData.email);
      if (!user) {
        throw createBusinessError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        throw createBusinessError('Conta desativada', 'ACCOUNT_DISABLED', 401);
      }

      // Verificar senha
      const isValidPassword = await this.passwordService.verifyPassword(
        validatedData.password, 
        user.passwordHash
      );
      
      if (!isValidPassword) {
        throw createBusinessError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
      }

      // Atualizar último login
      await this.userService.updateLastLogin(user.id);

      // Gerar tokens
      const accessToken = this.jwtService.generateAccessToken(user);
      const refreshToken = this.jwtService.generateRefreshToken(user);

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        username: user.username
      });

      // Definir cookie com o token de acesso para sessão web
      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            tags: user.tags,
            lastLoginAt: user.lastLoginAt
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Login error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * GET /auth/profile - Perfil do usuário
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.sub;
      const user = await this.userService.findById(userId);
      
      if (!user) {
        throw createBusinessError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          tags: user.tags,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Get profile error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * PUT /auth/profile - Atualizar perfil
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.sub;
      const validatedData = UpdateUserSchema.parse(req.body);
      
      // Verificar se username já existe (se foi alterado)
      if (validatedData.username) {
        const existingUser = await this.userService.findByUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          throw createBusinessError('Username já está em uso', 'USERNAME_ALREADY_EXISTS', 400);
        }
      }

      const user = await this.userService.update(userId, validatedData as UpdateUserData);
      
      logger.info('Profile updated successfully', {
        userId: user.id,
        updatedFields: Object.keys(validatedData)
      });

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          tags: user.tags,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Update profile error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * POST /auth/change-password - Alterar senha
   */
  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.sub;
      const validatedData = ChangePasswordSchema.parse(req.body);
      
      // Buscar usuário
      const user = await this.userService.findById(userId);
      if (!user) {
        throw createBusinessError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await this.passwordService.verifyPassword(
        validatedData.currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        throw createBusinessError('Senha atual incorreta', 'INVALID_CURRENT_PASSWORD', 400);
      }

      // Hash da nova senha
      const newPasswordHash = await this.passwordService.hashPassword(validatedData.newPassword);

      // Atualizar senha
      await this.userService.updatePassword(userId, newPasswordHash);

      logger.info('Password changed successfully', {
        userId: user.id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Change password error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * POST /auth/refresh - Renovar access token
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw createBusinessError('Refresh token é obrigatório', 'REFRESH_TOKEN_REQUIRED', 400);
      }

      // Decodificar refresh token
      const claims = this.jwtService.verifyToken(refreshToken);
      
      // Buscar usuário
      const user = await this.userService.findById(claims.sub);
      if (!user) {
        throw createBusinessError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
      }

      // Gerar novo access token
      const newAccessToken = this.jwtService.generateAccessToken(user);

      logger.info('Token refreshed successfully', {
        userId: user.id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Refresh token error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };

  /**
   * POST /auth/logout - Logout (invalidar refresh token)
   */
  logout = async (req: Request, res: Response) => {
    try {
      // Em uma implementação mais robusta, você manteria uma blacklist de tokens
      // Por enquanto, apenas retornamos sucesso
      
      logger.info('User logged out', {
        userId: (req as any).user?.sub,
        email: (req as any).user?.email
      });

      // Limpar cookie de autenticação
      res.clearCookie('auth_token');

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Logout error:', error);
        throw error;
      }
      throw createBusinessError('Erro interno do servidor', 'INTERNAL_ERROR', 500);
    }
  };
}
