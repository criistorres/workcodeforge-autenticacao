import { User } from './user.entity';
export declare class UsersService {
    private users;
    constructor();
    private createInitialUsers;
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: string): Promise<User | undefined>;
    create(userData: Partial<User>): Promise<User>;
    validatePassword(user: User, password: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
    updateTags(userId: string, tags: string[]): Promise<User | undefined>;
}
