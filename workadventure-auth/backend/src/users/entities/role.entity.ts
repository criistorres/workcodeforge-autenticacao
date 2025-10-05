import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string; // 'admin', 'moderator', 'member'

  @Column({ length: 255 })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 7 })
  color: string; // hex color (#FF5733)

  @Column('simple-array', { default: '' })
  permissions: string[]; // ['users.view', 'users.edit', etc]

  @Column({ default: false })
  isSystem: boolean; // roles do sistema não podem ser deletadas

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
