"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OIDCController_1 = require("../controllers/OIDCController");
const OIDCService_1 = require("../services/OIDCService");
const UserServiceSQLite_1 = require("../services/UserServiceSQLite");
const JWTService_1 = require("../services/JWTService");
const router = (0, express_1.Router)();
const userService = new UserServiceSQLite_1.UserServiceSQLite();
const jwtService = new JWTService_1.JWTService();
const oidcService = new OIDCService_1.OIDCService(userService, jwtService);
const oidcController = new OIDCController_1.OIDCController(oidcService);
router.get('/.well-known/openid-configuration', oidcController.discovery);
router.get('/oauth/authorize', oidcController.authorize);
router.post('/oauth/token', oidcController.token);
router.get('/oauth/userinfo', oidcController.userinfo);
router.get('/oauth/jwks', oidcController.jwks);
exports.default = router;
//# sourceMappingURL=oidc.js.map