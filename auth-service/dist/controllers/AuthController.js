"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const UserSchema_1 = require("../schemas/UserSchema");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class AuthController {
    constructor(userService, jwtService, passwordService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordService = passwordService;
        this.register = async (req, res) => {
            try {
                logger_1.logger.info('Tentativa de registro recebida', { body: req.body });
                const validatedData = UserSchema_1.RegisterUserSchema.parse(req.body);
                logger_1.logger.info('Dados validados com sucesso', { validatedData: { ...validatedData, password: '[HIDDEN]' } });
                const existingUserByEmail = await this.userService.findByEmail(validatedData.email);
                if (existingUserByEmail) {
                    throw (0, errorHandler_1.createBusinessError)('Email já está em uso', 'EMAIL_ALREADY_EXISTS', 400);
                }
                const existingUserByUsername = await this.userService.findByUsername(validatedData.username);
                if (existingUserByUsername) {
                    throw (0, errorHandler_1.createBusinessError)('Username já está em uso', 'USERNAME_ALREADY_EXISTS', 400);
                }
                const passwordHash = await this.passwordService.hashPassword(validatedData.password);
                const { password, ...userDataWithoutPassword } = validatedData;
                const user = await this.userService.create({
                    ...userDataWithoutPassword,
                    passwordHash
                });
                const accessToken = this.jwtService.generateAccessToken(user);
                const refreshToken = this.jwtService.generateRefreshToken(user);
                logger_1.logger.info('User registered successfully', {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Registration error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.login = async (req, res) => {
            try {
                const validatedData = UserSchema_1.LoginUserSchema.parse(req.body);
                const user = await this.userService.findByEmail(validatedData.email);
                if (!user) {
                    throw (0, errorHandler_1.createBusinessError)('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
                }
                if (!user.isActive) {
                    throw (0, errorHandler_1.createBusinessError)('Conta desativada', 'ACCOUNT_DISABLED', 401);
                }
                const isValidPassword = await this.passwordService.verifyPassword(validatedData.password, user.passwordHash);
                if (!isValidPassword) {
                    throw (0, errorHandler_1.createBusinessError)('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
                }
                await this.userService.updateLastLogin(user.id);
                const accessToken = this.jwtService.generateAccessToken(user);
                const refreshToken = this.jwtService.generateRefreshToken(user);
                logger_1.logger.info('User logged in successfully', {
                    userId: user.id,
                    email: user.email,
                    username: user.username
                });
                res.cookie('auth_token', accessToken, {
                    httpOnly: true,
                    secure: process.env['NODE_ENV'] === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
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
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Login error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.getProfile = async (req, res) => {
            try {
                const userId = req.user.sub;
                const user = await this.userService.findById(userId);
                if (!user) {
                    throw (0, errorHandler_1.createBusinessError)('Usuário não encontrado', 'USER_NOT_FOUND', 404);
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
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Get profile error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                const userId = req.user.sub;
                const validatedData = UserSchema_1.UpdateUserSchema.parse(req.body);
                if (validatedData.username) {
                    const existingUser = await this.userService.findByUsername(validatedData.username);
                    if (existingUser && existingUser.id !== userId) {
                        throw (0, errorHandler_1.createBusinessError)('Username já está em uso', 'USERNAME_ALREADY_EXISTS', 400);
                    }
                }
                const user = await this.userService.update(userId, validatedData);
                logger_1.logger.info('Profile updated successfully', {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Update profile error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.changePassword = async (req, res) => {
            try {
                const userId = req.user.sub;
                const validatedData = UserSchema_1.ChangePasswordSchema.parse(req.body);
                const user = await this.userService.findById(userId);
                if (!user) {
                    throw (0, errorHandler_1.createBusinessError)('Usuário não encontrado', 'USER_NOT_FOUND', 404);
                }
                const isCurrentPasswordValid = await this.passwordService.verifyPassword(validatedData.currentPassword, user.passwordHash);
                if (!isCurrentPasswordValid) {
                    throw (0, errorHandler_1.createBusinessError)('Senha atual incorreta', 'INVALID_CURRENT_PASSWORD', 400);
                }
                const newPasswordHash = await this.passwordService.hashPassword(validatedData.newPassword);
                await this.userService.updatePassword(userId, newPasswordHash);
                logger_1.logger.info('Password changed successfully', {
                    userId: user.id,
                    email: user.email
                });
                res.json({
                    success: true,
                    message: 'Senha alterada com sucesso'
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Change password error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    throw (0, errorHandler_1.createBusinessError)('Refresh token é obrigatório', 'REFRESH_TOKEN_REQUIRED', 400);
                }
                const claims = this.jwtService.verifyToken(refreshToken);
                const user = await this.userService.findById(claims.sub);
                if (!user) {
                    throw (0, errorHandler_1.createBusinessError)('Usuário não encontrado', 'USER_NOT_FOUND', 404);
                }
                const newAccessToken = this.jwtService.generateAccessToken(user);
                logger_1.logger.info('Token refreshed successfully', {
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
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Refresh token error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
        this.logout = async (req, res) => {
            try {
                logger_1.logger.info('User logged out', {
                    userId: req.user?.sub,
                    email: req.user?.email
                });
                res.clearCookie('auth_token');
                res.json({
                    success: true,
                    message: 'Logout realizado com sucesso'
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    logger_1.logger.error('Logout error:', error);
                    throw error;
                }
                throw (0, errorHandler_1.createBusinessError)('Erro interno do servidor', 'INTERNAL_ERROR', 500);
            }
        };
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map