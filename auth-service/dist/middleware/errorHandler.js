"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessError = exports.ValidationError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.createValidationError = createValidationError;
exports.createBusinessError = createBusinessError;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(errors) {
        super('Dados inválidos', 400);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class BusinessError extends AppError {
    constructor(message, code, statusCode = 400) {
        super(message, statusCode);
        this.code = code;
    }
}
exports.BusinessError = BusinessError;
function errorHandler(error, req, res, _next) {
    logger_1.logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors
        });
        return;
    }
    if (error instanceof BusinessError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code
        });
        return;
    }
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
        return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
        return;
    }
    logger_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: process.env['NODE_ENV'] === 'production'
            ? 'Erro interno do servidor'
            : error.message
    });
}
function notFoundHandler(req, _res, next) {
    const error = new AppError(`Rota ${req.originalUrl} não encontrada`, 404);
    next(error);
}
function createValidationError(errors) {
    return new ValidationError(errors);
}
function createBusinessError(message, code, statusCode = 400) {
    return new BusinessError(message, code, statusCode);
}
//# sourceMappingURL=errorHandler.js.map