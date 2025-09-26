"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordService = exports.PasswordService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const logger_1 = require("../utils/logger");
class PasswordService {
    constructor() {
        this.saltRounds = 12;
    }
    async hashPassword(password) {
        try {
            const hash = await bcrypt.hash(password, this.saltRounds);
            logger_1.logger.debug('Hash de senha gerado com sucesso');
            return hash;
        }
        catch (error) {
            logger_1.logger.error('Erro ao gerar hash da senha:', error);
            throw new Error('Falha ao processar senha');
        }
    }
    async verifyPassword(password, hash) {
        try {
            const isValid = await bcrypt.compare(password, hash);
            logger_1.logger.debug('Verificação de senha realizada', { isValid });
            return isValid;
        }
        catch (error) {
            logger_1.logger.error('Erro ao verificar senha:', error);
            throw new Error('Falha ao verificar senha');
        }
    }
    validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Senha deve ter pelo menos 8 caracteres');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
        }
        const commonSequences = ['123', 'abc', 'qwe', 'asd', 'zxc'];
        const lowerPassword = password.toLowerCase();
        for (const sequence of commonSequences) {
            if (lowerPassword.includes(sequence)) {
                errors.push('Senha não deve conter sequências comuns');
                break;
            }
        }
        if (password === password.toLowerCase() || password === password.toUpperCase()) {
            errors.push('Senha deve conter uma mistura de letras maiúsculas e minúsculas');
        }
        const result = {
            isValid: errors.length === 0,
            errors
        };
        logger_1.logger.debug('Validação de força da senha realizada', result);
        return result;
    }
    generateRandomPassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
        let password = '';
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        password += '0123456789'[Math.floor(Math.random() * 10)];
        password += '@$!%*?&'[Math.floor(Math.random() * 7)];
        for (let i = 4; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
}
exports.PasswordService = PasswordService;
exports.passwordService = new PasswordService();
exports.default = exports.passwordService;
//# sourceMappingURL=PasswordService.js.map