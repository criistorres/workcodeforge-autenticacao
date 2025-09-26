import { Router } from 'express';
import { OIDCController } from '../controllers/OIDCController';
import { OIDCService } from '../services/OIDCService';
import { UserServiceSQLite } from '../services/UserServiceSQLite';
import { JWTService } from '../services/JWTService';

const router = Router();

// Inicializar serviços
const userService = new UserServiceSQLite();
const jwtService = new JWTService();
const oidcService = new OIDCService(userService, jwtService);
const oidcController = new OIDCController(oidcService);

// Discovery endpoint
router.get('/.well-known/openid-configuration', oidcController.discovery);

// OAuth/OIDC endpoints
router.get('/oauth/authorize', oidcController.authorize);
router.post('/oauth/token', oidcController.token);
router.get('/oauth/userinfo', oidcController.userinfo);
router.get('/oauth/jwks', oidcController.jwks);

export default router;
