import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    readonly errors: Array<{
        field: string;
        message: string;
        code: string;
    }>;
    constructor(errors: Array<{
        field: string;
        message: string;
        code: string;
    }>);
}
export declare class BusinessError extends AppError {
    readonly code: string;
    constructor(message: string, code: string, statusCode?: number);
}
export declare function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void;
export declare function notFoundHandler(req: Request, _res: Response, next: NextFunction): void;
export declare function createValidationError(errors: Array<{
    field: string;
    message: string;
    code: string;
}>): ValidationError;
export declare function createBusinessError(message: string, code: string, statusCode?: number): BusinessError;
//# sourceMappingURL=errorHandler.d.ts.map