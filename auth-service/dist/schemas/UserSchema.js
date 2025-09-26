"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordSchema = exports.UpdateUserSchema = exports.LoginUserSchema = exports.RegisterUserSchema = void 0;
const zod_1 = require("zod");
exports.RegisterUserSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email('Email deve ter formato válido')
        .toLowerCase()
        .transform(email => email.trim()),
    username: zod_1.z.string()
        .min(3, 'Username deve ter pelo menos 3 caracteres')
        .max(30, 'Username deve ter no máximo 30 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore')
        .transform(username => username.toLowerCase()),
    password: zod_1.z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
    name: zod_1.z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .transform(name => name.trim()),
    tags: zod_1.z.array(zod_1.z.string())
        .optional()
        .default([])
        .refine(tags => tags.length <= 10, 'Máximo 10 tags permitidas')
});
exports.LoginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Senha é obrigatória')
});
exports.UpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .optional(),
    username: zod_1.z.string()
        .min(3, 'Username deve ter pelo menos 3 caracteres')
        .max(30, 'Username deve ter no máximo 30 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore')
        .transform(username => username.toLowerCase())
        .optional(),
    tags: zod_1.z.array(zod_1.z.string())
        .max(10, 'Máximo 10 tags permitidas')
        .optional()
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: zod_1.z.string()
        .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial')
});
//# sourceMappingURL=UserSchema.js.map