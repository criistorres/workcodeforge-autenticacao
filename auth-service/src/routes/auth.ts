import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserServiceSQLite } from '../services/UserServiceSQLite';
import { JWTService } from '../services/JWTService';
import { PasswordService } from '../services/PasswordService';
import { 
  RegisterUserSchema, 
  LoginUserSchema, 
  UpdateUserSchema, 
  ChangePasswordSchema 
} from '../schemas/UserSchema';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

console.log('🔧 Carregando arquivo de rotas de autenticação...');

const router = Router();

// Rota de teste para debug (sem dependências)
router.get('/test', (_req, res) => {
  console.log('Teste GET recebido');
  res.json({ success: true, message: 'Endpoint GET funcionando' });
});

router.post('/test', (req, res) => {
  console.log('Teste POST recebido', { body: req.body });
  res.json({ success: true, message: 'Endpoint POST funcionando', body: req.body });
});

// Rota de teste para registro (sem validação)
router.post('/test-register', (req, res) => {
  console.log('Teste registro recebido', { body: req.body });
  try {
    // Simular processamento
    res.json({ success: true, message: 'Registro de teste funcionando', body: req.body });
  } catch (error) {
    console.error('Erro no teste de registro:', error);
    res.status(500).json({ success: false, message: 'Erro no teste de registro', error: error instanceof Error ? error.message : 'Erro desconhecido' });
  }
});

// Inicializar serviços com tratamento de erro
let userService: UserServiceSQLite = {} as UserServiceSQLite;
let jwtService: JWTService = {} as JWTService;
let passwordService: PasswordService = {} as PasswordService;
let authController: AuthController = {} as AuthController;

console.log('Iniciando inicialização dos serviços...');

try {
  console.log('Criando UserServiceSQLite...');
  userService = new UserServiceSQLite();
  console.log('UserServiceSQLite criado');
  
  console.log('Criando JWTService...');
  jwtService = new JWTService();
  console.log('JWTService criado');
  
  console.log('Criando PasswordService...');
  passwordService = new PasswordService();
  console.log('PasswordService criado');
  
  console.log('Criando AuthController...');
  authController = new AuthController(userService, jwtService, passwordService);
  console.log('AuthController criado');
  
  console.log('✅ Serviços inicializados com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar serviços:', error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
  // Criar serviços vazios para evitar crash
  userService = {} as UserServiceSQLite;
  jwtService = {} as JWTService;
  passwordService = {} as PasswordService;
  authController = {} as AuthController;
}

// Schema para refresh token
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
});

// Wrapper para o middleware de autenticação
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req as AuthenticatedRequest, res, next);
};

/**
 * @route   POST /auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post('/register', 
  validateRequest(RegisterUserSchema),
  authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login',
  validateRequest(LoginUserSchema),
  authController.login
);

/**
 * @route   GET /auth/profile
 * @desc    Obter perfil do usuário
 * @access  Private
 */
router.get('/profile',
  authMiddleware,
  authController.getProfile
);

/**
 * @route   PUT /auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put('/profile',
  authMiddleware,
  validateRequest(UpdateUserSchema),
  authController.updateProfile
);

/**
 * @route   POST /auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.post('/change-password',
  authMiddleware,
  validateRequest(ChangePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /auth/refresh
 * @desc    Renovar access token
 * @access  Public
 */
router.post('/refresh',
  validateRequest(RefreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /auth/logout
 * @desc    Logout do usuário
 * @access  Private
 */
router.post('/logout',
  authMiddleware,
  authController.logout
);

export default router;
