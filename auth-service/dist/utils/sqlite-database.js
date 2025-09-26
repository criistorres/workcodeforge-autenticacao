"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteDb = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const logger_1 = require("./logger");
const path_1 = __importDefault(require("path"));
class SQLiteDatabase {
    constructor() {
        this.db = null;
    }
    static getInstance() {
        if (!SQLiteDatabase.instance) {
            SQLiteDatabase.instance = new SQLiteDatabase();
        }
        return SQLiteDatabase.instance;
    }
    async initialize() {
        if (this.db) {
            return;
        }
        try {
            const dbPath = process.env['SQLITE_DB_PATH'] || path_1.default.join(process.cwd(), 'data', 'auth.db');
            const dbDir = path_1.default.dirname(dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            this.db = new better_sqlite3_1.default(dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 1000');
            this.db.pragma('foreign_keys = ON');
            this.db.pragma('temp_store = MEMORY');
            logger_1.logger.info(`Banco de dados SQLite inicializado: ${dbPath}`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao inicializar banco de dados SQLite:', error);
            throw error;
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
        }
        return this.db;
    }
    async query(sql, params = []) {
        if (!this.db) {
            throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
        }
        try {
            const stmt = this.db.prepare(sql);
            const trimmedSql = sql.trim().toLowerCase();
            const isSelect = trimmedSql.startsWith('select') ||
                trimmedSql.startsWith('with') ||
                trimmedSql.startsWith('pragma');
            if (isSelect) {
                if (params.length === 0) {
                    return stmt.all();
                }
                else {
                    return stmt.all(...params);
                }
            }
            else {
                if (params.length === 0) {
                    const result = stmt.run();
                    return {
                        changes: result.changes,
                        lastInsertRowid: result.lastInsertRowid,
                        rows: []
                    };
                }
                else {
                    const result = stmt.run(...params);
                    return {
                        changes: result.changes,
                        lastInsertRowid: result.lastInsertRowid,
                        rows: []
                    };
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Erro na query SQLite:', { sql, params, error });
            throw error;
        }
    }
    async transaction(callback) {
        if (!this.db) {
            throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
        }
        const transaction = this.db.transaction(callback);
        try {
            return transaction();
        }
        catch (error) {
            logger_1.logger.error('Erro na transação SQLite:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            const result = await this.query('SELECT datetime(\'now\') as current_time');
            logger_1.logger.info('Conexão com SQLite testada com sucesso:', result[0]);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Falha no teste de conexão com SQLite:', error);
            return false;
        }
    }
    async close() {
        if (!this.db) {
            return;
        }
        try {
            this.db.close();
            this.db = null;
            logger_1.logger.info('Conexão com SQLite fechada');
        }
        catch (error) {
            logger_1.logger.error('Erro ao fechar conexão com SQLite:', error);
            throw error;
        }
    }
    async runMigration(sql) {
        try {
            await this.query(sql);
            logger_1.logger.info('Migração executada com sucesso');
        }
        catch (error) {
            logger_1.logger.error('Erro ao executar migração:', { sql, error });
            throw error;
        }
    }
    async tableExists(tableName) {
        try {
            const result = await this.query("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [tableName]);
            return result.length > 0;
        }
        catch (error) {
            logger_1.logger.error('Erro ao verificar existência da tabela:', { tableName, error });
            return false;
        }
    }
    async getTableInfo(tableName) {
        try {
            return await this.query(`PRAGMA table_info(${tableName})`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao obter informações da tabela:', { tableName, error });
            throw error;
        }
    }
}
exports.sqliteDb = SQLiteDatabase.getInstance();
exports.default = exports.sqliteDb;
//# sourceMappingURL=sqlite-database.js.map