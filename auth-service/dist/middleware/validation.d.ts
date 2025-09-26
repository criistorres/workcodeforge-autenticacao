import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare function validateRequest(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateQuery(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateParams(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map