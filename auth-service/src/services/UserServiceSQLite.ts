import { User, CreateUserData, UpdateUserData } from '../models/User';
import { sqliteDb } from '../utils/sqlite-database';
import { logger } from '../utils/logger';

export class UserServiceSQLite {
  /**
   * Cria um novo usuário
   * @param userData Dados do usuário
   * @returns Promise<User> Usuário criado
   */
  async create(userData: CreateUserData): Promise<User> {
    try {
      logger.info('Criando usuário', { userData: { ...userData, passwordHash: '[HIDDEN]' } });
      
      // Gerar UUID manualmente
      const { v4: uuidv4 } = require('uuid');
      const userId = uuidv4();
      
      const query = `
        INSERT INTO users (id, email, username, password_hash, name, tags, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        userId,
        userData.email.toLowerCase(),
        userData.username.toLowerCase(),
        userData.passwordHash,
        userData.name,
        JSON.stringify(userData.tags || []),
        1 // SQLite usa 1 para true
      ];
      
      logger.info('Executando query de inserção', { query, values: [...values.slice(0, 3), '[HIDDEN]', ...values.slice(4)] });
      
      await sqliteDb.query(query, values);
      
      // Buscar o usuário criado
      const createdUser = await this.findById(userId);
      if (!createdUser) {
        throw new Error('Falha ao recuperar usuário criado');
      }
      
      logger.info('Usuário criado com sucesso', { userId: createdUser.id, email: createdUser.email });
      return createdUser;
    } catch (error: any) {
      logger.error('Erro ao criar usuário:', { error: error.message, userData });
      
      // Tratar erros específicos do SQLite
      if (error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('email')) {
          throw new Error('Email já está em uso');
        }
        if (error.message.includes('username')) {
          throw new Error('Username já está em uso');
        }
      }
      
      throw new Error('Falha ao criar usuário');
    }
  }

  /**
   * Busca usuário por ID
   * @param id ID do usuário
   * @returns Promise<User | null> Usuário encontrado ou null
   */
  async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE id = ?
      `;
      
      const result = await sqliteDb.query(query, [id]);
      
      if (result.length === 0) {
        return null;
      }
      
      return this.mapRowToUser(result[0]);
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', { id, error });
      throw new Error('Falha ao buscar usuário');
    }
  }

  /**
   * Busca usuário por email
   * @param email Email do usuário
   * @returns Promise<User | null> Usuário encontrado ou null
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE email = ?
      `;
      
      const result = await sqliteDb.query(query, [email.toLowerCase()]);
      
      if (result.length === 0) {
        return null;
      }
      
      return this.mapRowToUser(result[0]);
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', { email, error });
      throw new Error('Falha ao buscar usuário');
    }
  }

  /**
   * Busca usuário por username
   * @param username Username do usuário
   * @returns Promise<User | null> Usuário encontrado ou null
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE username = ?
      `;
      
      const result = await sqliteDb.query(query, [username.toLowerCase()]);
      
      if (result.length === 0) {
        return null;
      }
      
      return this.mapRowToUser(result[0]);
    } catch (error) {
      logger.error('Erro ao buscar usuário por username:', { username, error });
      throw new Error('Falha ao buscar usuário');
    }
  }

  /**
   * Atualiza dados do usuário
   * @param id ID do usuário
   * @param userData Dados para atualizar
   * @returns Promise<User> Usuário atualizado
   */
  async update(id: string, userData: UpdateUserData): Promise<User> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (userData.name !== undefined) {
        updateFields.push('name = ?');
        values.push(userData.name);
      }

      if (userData.username !== undefined) {
        updateFields.push('username = ?');
        values.push(userData.username.toLowerCase());
      }

      if (userData.tags !== undefined) {
        updateFields.push('tags = ?');
        values.push(JSON.stringify(userData.tags));
      }

      if (userData.isActive !== undefined) {
        updateFields.push('is_active = ?');
        values.push(userData.isActive ? 1 : 0);
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      values.push(id); // ID do usuário
      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;

      const result = await sqliteDb.query(query, values);
      
      if (result.changes === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar usuário atualizado
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Falha ao recuperar usuário atualizado');
      }

      logger.info('Usuário atualizado com sucesso', { userId: updatedUser.id, updatedFields: Object.keys(userData) });
      return updatedUser;
    } catch (error: any) {
      logger.error('Erro ao atualizar usuário:', { id, userData, error: error.message });
      throw new Error('Falha ao atualizar usuário');
    }
  }

  /**
   * Atualiza a senha do usuário
   * @param id ID do usuário
   * @param passwordHash Novo hash da senha
   * @returns Promise<void>
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET password_hash = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      const result = await sqliteDb.query(query, [passwordHash, id]);
      
      if (result.changes === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      logger.info('Senha do usuário atualizada com sucesso', { userId: id });
    } catch (error) {
      logger.error('Erro ao atualizar senha do usuário:', { id, error });
      throw new Error('Falha ao atualizar senha');
    }
  }

  /**
   * Atualiza o último login do usuário
   * @param id ID do usuário
   * @returns Promise<void>
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET last_login_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `;
      
      const result = await sqliteDb.query(query, [id]);
      
      if (result.changes === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      logger.debug('Último login atualizado', { userId: id });
    } catch (error) {
      logger.error('Erro ao atualizar último login:', { id, error });
      throw new Error('Falha ao atualizar último login');
    }
  }

  /**
   * Lista usuários com paginação
   * @param page Página (começando em 1)
   * @param limit Limite por página
   * @param active Apenas usuários ativos
   * @returns Promise<{ users: User[]; total: number; page: number; limit: number }>
   */
  async list(page: number = 1, limit: number = 10, active?: boolean): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      let countParams: any[] = [];
      let listParams: any[] = [];

      if (active !== undefined) {
        whereClause = 'WHERE is_active = ?';
        countParams = [active ? 1 : 0];
        listParams = [active ? 1 : 0, limit, offset];
      } else {
        listParams = [limit, offset];
      }

      // Contar total de usuários
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await sqliteDb.query(countQuery, countParams);
      const total = countResult[0].total;

      // Buscar usuários
      const listQuery = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const result = await sqliteDb.query(listQuery, listParams);
      const users = result.map((row: Record<string, any>) => this.mapRowToUser(row));

      return {
        users,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Erro ao listar usuários:', { page, limit, active, error });
      throw new Error('Falha ao listar usuários');
    }
  }

  /**
   * Deleta um usuário (soft delete)
   * @param id ID do usuário
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users
        SET is_active = 0, updated_at = datetime('now')
        WHERE id = ?
      `;
      
      const result = await sqliteDb.query(query, [id]);
      
      if (result.changes === 0) {
        throw new Error('Usuário não encontrado');
      }

      logger.info('Usuário desativado com sucesso', { userId: id });
    } catch (error: any) {
      logger.error('Erro ao deletar usuário:', { id, error: error.message });
      throw new Error('Falha ao deletar usuário');
    }
  }

  /**
   * Conta o total de usuários
   * @returns Promise<number> Total de usuários
   */
  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as total FROM users';
      const result = await sqliteDb.query(query);
      return result[0].total;
    } catch (error) {
      logger.error('Erro ao contar usuários:', { error });
      throw new Error('Falha ao contar usuários');
    }
  }

  /**
   * Conta usuários ativos
   * @returns Promise<number> Total de usuários ativos
   */
  async countActive(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
      const result = await sqliteDb.query(query);
      return result[0].total;
    } catch (error) {
      logger.error('Erro ao contar usuários ativos:', { error });
      throw new Error('Falha ao contar usuários ativos');
    }
  }

  /**
   * Conta usuários registrados após uma data
   * @param date Data limite
   * @returns Promise<number> Total de usuários registrados após a data
   */
  async countRegisteredAfter(date: Date): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as total FROM users WHERE created_at >= ?';
      const result = await sqliteDb.query(query, [date.toISOString()]);
      return result[0].total;
    } catch (error) {
      logger.error('Erro ao contar usuários registrados após data:', { date, error });
      throw new Error('Falha ao contar usuários registrados após data');
    }
  }

  /**
   * Converte uma linha do banco para o modelo User
   * @param row Linha do banco de dados
   * @returns User
   */
  private mapRowToUser(row: Record<string, any>): User {
    const user: User = {
      id: row['id'],
      email: row['email'],
      username: row['username'],
      passwordHash: row['password_hash'],
      name: row['name'],
      tags: typeof row['tags'] === 'string' ? JSON.parse(row['tags']) : (row['tags'] || []),
      isActive: Boolean(row['is_active']),
      createdAt: new Date(row['created_at']),
      updatedAt: new Date(row['updated_at'])
    };

    // Adicionar lastLoginAt apenas se existir
    if (row['last_login_at']) {
      user.lastLoginAt = new Date(row['last_login_at']);
    }

    return user;
  }
}

export const userServiceSQLite = new UserServiceSQLite();
export default userServiceSQLite;
