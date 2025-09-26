export declare class PasswordService {
    private readonly saltRounds;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    generateRandomPassword(length?: number): string;
}
export declare const passwordService: PasswordService;
export default passwordService;
//# sourceMappingURL=PasswordService.d.ts.map