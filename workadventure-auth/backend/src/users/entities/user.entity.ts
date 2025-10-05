import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { SessionEntity } from './session.entity';
import { AuditLogEntity } from './audit-log.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column('simple-array', { default: 'member' })
  tags: string[];

  @Column({ nullable: true, length: 500 })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date;

  @Column({ type: 'text', nullable: true })
  blockedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @OneToMany(() => SessionEntity, session => session.user)
  sessions: SessionEntity[];

  @OneToMany(() => AuditLogEntity, log => log.user)
  auditLogs: AuditLogEntity[];
}
