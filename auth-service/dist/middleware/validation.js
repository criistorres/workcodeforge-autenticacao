"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const zod_1 = require("zod");
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    };
}
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.query);
            req.query = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                res.status(400).json({
                    success: false,
                    message: 'Parâmetros de consulta inválidos',
                    errors
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    };
}
function validateParams(schema) {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse(req.params);
            req.params = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));
                res.status(400).json({
                    success: false,
                    message: 'Parâmetros de rota inválidos',
                    errors
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    };
}
//# sourceMappingURL=validation.js.map