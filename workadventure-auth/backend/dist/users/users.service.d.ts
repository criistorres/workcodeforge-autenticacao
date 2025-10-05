import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
export declare class UsersService {
    private usersRepository;
    private auditLogRepository;
    constructor(usersRepository: Repository<UserEntity>, auditLogRepository: Repository<AuditLogEntity>);
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: string): Promise<UserEntity | null>;
    create(userData: Partial<UserEntity>): Promise<UserEntity>;
    validatePassword(user: UserEntity, password: string): Promise<boolean>;
    getAllUsers(): Promise<UserEntity[]>;
    updateTags(userId: string, tags: string[]): Promise<UserEntity | null>;
    updateLastLogin(userId: string): Promise<void>;
    deleteUser(userId: string): Promise<boolean>;
    createAuditLog(userId: string, action: string, targetId: string | null, metadata: any): Promise<AuditLogEntity>;
    getAuditLogs(limit?: number): Promise<AuditLogEntity[]>;
    getUserStats(): Promise<any>;
}
