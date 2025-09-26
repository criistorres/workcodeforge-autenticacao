"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const UserServiceSQLite_1 = require("../services/UserServiceSQLite");
const JWTService_1 = require("../services/JWTService");
const PasswordService_1 = require("../services/PasswordService");
const UserSchema_1 = require("../schemas/UserSchema");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
console.log('🔧 Carregando arquivo de rotas de autenticação...');
const router = (0, express_1.Router)();
router.get('/test', (_req, res) => {
    console.log('Teste GET recebido');
    res.json({ success: true, message: 'Endpoint GET funcionando' });
});
router.post('/test', (req, res) => {
    console.log('Teste POST recebido', { body: req.body });
    res.json({ success: true, message: 'Endpoint POST funcionando', body: req.body });
});
router.post('/test-register', (req, res) => {
    console.log('Teste registro recebido', { body: req.body });
    try {
        res.json({ success: true, message: 'Registro de teste funcionando', body: req.body });
    }
    catch (error) {
        console.error('Erro no teste de registro:', error);
        res.status(500).json({ success: false, message: 'Erro no teste de registro', error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
});
let userService = {};
let jwtService = {};
let passwordService = {};
let authController = {};
console.log('Iniciando inicialização dos serviços...');
try {
    console.log('Criando UserServiceSQLite...');
    userService = new UserServiceSQLite_1.UserServiceSQLite();
    console.log('UserServiceSQLite criado');
    console.log('Criando JWTService...');
    jwtService = new JWTService_1.JWTService();
    console.log('JWTService criado');
    console.log('Criando PasswordService...');
    passwordService = new PasswordService_1.PasswordService();
    console.log('PasswordService criado');
    console.log('Criando AuthController...');
    authController = new AuthController_1.AuthController(userService, jwtService, passwordService);
    console.log('AuthController criado');
    console.log('✅ Serviços inicializados com sucesso');
}
catch (error) {
    console.error('❌ Erro ao inicializar serviços:', error);
    if (error instanceof Error) {
        console.error('Stack trace:', error.stack);
    }
    userService = {};
    jwtService = {};
    passwordService = {};
    authController = {};
}
const RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token é obrigatório')
});
const authMiddleware = (req, res, next) => {
    (0, auth_1.authenticateToken)(req, res, next);
};
router.post('/register', (0, validation_1.validateRequest)(UserSchema_1.RegisterUserSchema), authController.register);
router.post('/login', (0, validation_1.validateRequest)(UserSchema_1.LoginUserSchema), authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, (0, validation_1.validateRequest)(UserSchema_1.UpdateUserSchema), authController.updateProfile);
router.post('/change-password', authMiddleware, (0, validation_1.validateRequest)(UserSchema_1.ChangePasswordSchema), authController.changePassword);
router.post('/refresh', (0, validation_1.validateRequest)(RefreshTokenSchema), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map