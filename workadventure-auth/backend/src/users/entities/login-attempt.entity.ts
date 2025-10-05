import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('login_attempts')
@Index(['email', 'ipAddress', 'createdAt'])
export class LoginAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 45 })
  ipAddress: string;

  @Column({ nullable: true, length: 500 })
  userAgent: string;

  @Column()
  success: boolean;

  @Column({ nullable: true, length: 100 })
  failureReason: string; // 'invalid_password', 'user_blocked', 'user_not_found'

  @CreateDateColumn()
  createdAt: Date;
}
