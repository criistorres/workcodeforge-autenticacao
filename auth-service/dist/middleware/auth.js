"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
exports.requireScope = requireScope;
exports.requireTag = requireTag;
const JWTService_1 = require("../services/JWTService");
function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token de acesso requerido'
            });
            return;
        }
        const jwtService = new JWTService_1.JWTService();
        const decoded = jwtService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: error instanceof Error ? error.message : 'Token inválido'
        });
    }
}
function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const jwtService = new JWTService_1.JWTService();
            const decoded = jwtService.verifyToken(token);
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        next();
    }
}
function requireScope(scope) {
    return (req, res, next) => {
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
function requireTag(tag) {
    return (req, res, next) => {
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
//# sourceMappingURL=auth.js.map