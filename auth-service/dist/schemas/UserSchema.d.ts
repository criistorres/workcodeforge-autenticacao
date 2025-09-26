import { z } from 'zod';
export declare const RegisterUserSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    username: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    name: z.ZodEffects<z.ZodString, string, string>;
    tags: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>, string[], string[] | undefined>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    name: string;
    tags: string[];
    password: string;
}, {
    email: string;
    username: string;
    name: string;
    password: string;
    tags?: string[] | undefined;
}>;
export declare const LoginUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const UpdateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    name?: string | undefined;
    tags?: string[] | undefined;
}, {
    username?: string | undefined;
    name?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type RegisterUser = z.infer<typeof RegisterUserSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
//# sourceMappingURL=UserSchema.d.ts.map