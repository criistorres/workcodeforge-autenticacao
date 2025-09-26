import { User, CreateUserData, UpdateUserData } from '../models/User';
export declare class UserServiceSQLite {
    create(userData: CreateUserData): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    update(id: string, userData: UpdateUserData): Promise<User>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    list(page?: number, limit?: number, active?: boolean): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
    }>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
    countActive(): Promise<number>;
    countRegisteredAfter(date: Date): Promise<number>;
    private mapRowToUser;
}
export declare const userServiceSQLite: UserServiceSQLite;
export default userServiceSQLite;
//# sourceMappingURL=UserServiceSQLite.d.ts.map