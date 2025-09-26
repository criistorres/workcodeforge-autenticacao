"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServiceSQLite = exports.UserServiceSQLite = void 0;
const sqlite_database_1 = require("../utils/sqlite-database");
const logger_1 = require("../utils/logger");
class UserServiceSQLite {
    async create(userData) {
        try {
            logger_1.logger.info('Criando usuário', { userData: { ...userData, passwordHash: '[HIDDEN]' } });
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
                1
            ];
            logger_1.logger.info('Executando query de inserção', { query, values: [...values.slice(0, 3), '[HIDDEN]', ...values.slice(4)] });
            await sqlite_database_1.sqliteDb.query(query, values);
            const createdUser = await this.findById(userId);
            if (!createdUser) {
                throw new Error('Falha ao recuperar usuário criado');
            }
            logger_1.logger.info('Usuário criado com sucesso', { userId: createdUser.id, email: createdUser.email });
            return createdUser;
        }
        catch (error) {
            logger_1.logger.error('Erro ao criar usuário:', { error: error.message, userData });
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
    async findById(id) {
        try {
            const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE id = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [id]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar usuário por ID:', { id, error });
            throw new Error('Falha ao buscar usuário');
        }
    }
    async findByEmail(email) {
        try {
            const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE email = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [email.toLowerCase()]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar usuário por email:', { email, error });
            throw new Error('Falha ao buscar usuário');
        }
    }
    async findByUsername(username) {
        try {
            const query = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        WHERE username = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [username.toLowerCase()]);
            if (result.length === 0) {
                return null;
            }
            return this.mapRowToUser(result[0]);
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar usuário por username:', { username, error });
            throw new Error('Falha ao buscar usuário');
        }
    }
    async update(id, userData) {
        try {
            const updateFields = [];
            const values = [];
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
            values.push(id);
            const query = `
        UPDATE users
        SET ${updateFields.join(', ')}, updated_at = datetime('now')
        WHERE id = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, values);
            if (result.changes === 0) {
                throw new Error('Usuário não encontrado');
            }
            const updatedUser = await this.findById(id);
            if (!updatedUser) {
                throw new Error('Falha ao recuperar usuário atualizado');
            }
            logger_1.logger.info('Usuário atualizado com sucesso', { userId: updatedUser.id, updatedFields: Object.keys(userData) });
            return updatedUser;
        }
        catch (error) {
            logger_1.logger.error('Erro ao atualizar usuário:', { id, userData, error: error.message });
            throw new Error('Falha ao atualizar usuário');
        }
    }
    async updatePassword(id, passwordHash) {
        try {
            const query = `
        UPDATE users
        SET password_hash = ?, updated_at = datetime('now')
        WHERE id = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [passwordHash, id]);
            if (result.changes === 0) {
                throw new Error('Usuário não encontrado');
            }
            logger_1.logger.info('Senha do usuário atualizada com sucesso', { userId: id });
        }
        catch (error) {
            logger_1.logger.error('Erro ao atualizar senha do usuário:', { id, error });
            throw new Error('Falha ao atualizar senha');
        }
    }
    async updateLastLogin(id) {
        try {
            const query = `
        UPDATE users
        SET last_login_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [id]);
            if (result.changes === 0) {
                throw new Error('Usuário não encontrado');
            }
            logger_1.logger.debug('Último login atualizado', { userId: id });
        }
        catch (error) {
            logger_1.logger.error('Erro ao atualizar último login:', { id, error });
            throw new Error('Falha ao atualizar último login');
        }
    }
    async list(page = 1, limit = 10, active) {
        try {
            const offset = (page - 1) * limit;
            let whereClause = '';
            let countParams = [];
            let listParams = [];
            if (active !== undefined) {
                whereClause = 'WHERE is_active = ?';
                countParams = [active ? 1 : 0];
                listParams = [active ? 1 : 0, limit, offset];
            }
            else {
                listParams = [limit, offset];
            }
            const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
            const countResult = await sqlite_database_1.sqliteDb.query(countQuery, countParams);
            const total = countResult[0].total;
            const listQuery = `
        SELECT id, email, username, password_hash, name, tags, is_active, created_at, updated_at, last_login_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(listQuery, listParams);
            const users = result.map((row) => this.mapRowToUser(row));
            return {
                users,
                total,
                page,
                limit
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao listar usuários:', { page, limit, active, error });
            throw new Error('Falha ao listar usuários');
        }
    }
    async delete(id) {
        try {
            const query = `
        UPDATE users
        SET is_active = 0, updated_at = datetime('now')
        WHERE id = ?
      `;
            const result = await sqlite_database_1.sqliteDb.query(query, [id]);
            if (result.changes === 0) {
                throw new Error('Usuário não encontrado');
            }
            logger_1.logger.info('Usuário desativado com sucesso', { userId: id });
        }
        catch (error) {
            logger_1.logger.error('Erro ao deletar usuário:', { id, error: error.message });
            throw new Error('Falha ao deletar usuário');
        }
    }
    async count() {
        try {
            const query = 'SELECT COUNT(*) as total FROM users';
            const result = await sqlite_database_1.sqliteDb.query(query);
            return result[0].total;
        }
        catch (error) {
            logger_1.logger.error('Erro ao contar usuários:', { error });
            throw new Error('Falha ao contar usuários');
        }
    }
    async countActive() {
        try {
            const query = 'SELECT COUNT(*) as total FROM users WHERE is_active = 1';
            const result = await sqlite_database_1.sqliteDb.query(query);
            return result[0].total;
        }
        catch (error) {
            logger_1.logger.error('Erro ao contar usuários ativos:', { error });
            throw new Error('Falha ao contar usuários ativos');
        }
    }
    async countRegisteredAfter(date) {
        try {
            const query = 'SELECT COUNT(*) as total FROM users WHERE created_at >= ?';
            const result = await sqlite_database_1.sqliteDb.query(query, [date.toISOString()]);
            return result[0].total;
        }
        catch (error) {
            logger_1.logger.error('Erro ao contar usuários registrados após data:', { date, error });
            throw new Error('Falha ao contar usuários registrados após data');
        }
    }
    mapRowToUser(row) {
        const user = {
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
        if (row['last_login_at']) {
            user.lastLoginAt = new Date(row['last_login_at']);
        }
        return user;
    }
}
exports.UserServiceSQLite = UserServiceSQLite;
exports.userServiceSQLite = new UserServiceSQLite();
exports.default = exports.userServiceSQLite;
//# sourceMappingURL=UserServiceSQLite.js.map