import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity('admin_actions')
export class AdminActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'adminId' })
  admin: UserEntity;

  @Column({ length: 100 })
  actionType: string; // 'user.block', 'user.unblock', 'role.assign', 'user.delete'

  @Column({ nullable: true })
  targetUserId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: UserEntity;

  @Column({ nullable: true })
  targetRoleId: string;

  @ManyToOne(() => RoleEntity, { nullable: true })
  @JoinColumn({ name: 'targetRoleId' })
  targetRole: RoleEntity;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
