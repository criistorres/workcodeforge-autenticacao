import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, user => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  action: string; // 'login', 'logout', 'register', 'update_profile', 'update_tags', etc

  @Column({ nullable: true })
  targetId: string; // ID do recurso afetado (ex: outro userId se admin editou)

  @Column({ nullable: true, length: 50 })
  targetType: string; // 'user', 'role', 'session', etc

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 500 })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Dados extras (mudanças, etc)

  @CreateDateColumn()
  createdAt: Date;
}
