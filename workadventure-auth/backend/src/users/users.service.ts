import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Criar usuários de teste
    this.createInitialUsers();
  }

  private async createInitialUsers() {
    const hashedPwd = await bcrypt.hash('pwd', 10);

    const users: User[] = [
      {
        id: '1',
        email: 'user1@example.com',
        password: hashedPwd,
        name: 'User 1',
        username: 'user1',
        tags: ['admin', 'moderator'],
        createdAt: new Date()
      },
      {
        id: '2',
        email: 'user2@example.com',
        password: hashedPwd,
        name: 'User 2',
        username: 'user2',
        tags: ['member'],
        createdAt: new Date()
      },
      {
        id: '3',
        email: 'admin@example.com',
        password: hashedPwd,
        name: 'Admin User',
        username: 'admin',
        tags: ['admin', 'moderator'],
        createdAt: new Date()
      }
    ];

    users.forEach(user => this.users.set(user.id, user));
  }

  async findByEmail(email: string): Promise<User | undefined> {
    console.log(`[FIND BY EMAIL DEBUG] Procurando email: "${email}"`);
    console.log(`[FIND BY EMAIL DEBUG] Total de usuários no Map: ${this.users.size}`);
    const allEmails = Array.from(this.users.values()).map(u => u.email);
    console.log(`[FIND BY EMAIL DEBUG] Emails disponíveis:`, allEmails);
    const found = Array.from(this.users.values()).find(u => u.email === email);
    console.log(`[FIND BY EMAIL DEBUG] Usuário encontrado?`, found ? `SIM (ID: ${found.id})` : 'NÃO');
    return found;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user: User = {
      id: uuidv4(),
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      username: userData.username || userData.email.split('@')[0],
      tags: userData.tags || ['member'],
      createdAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateTags(userId: string, tags: string[]): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      user.tags = tags;
      this.users.set(userId, user);
    }
    return user;
  }
}
