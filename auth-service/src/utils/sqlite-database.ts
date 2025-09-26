import Database from 'better-sqlite3';
import { logger } from './logger';
import path from 'path';

class SQLiteDatabase {
  private db: Database.Database | null = null;
  private static instance: SQLiteDatabase;

  private constructor() {
    // Não inicializar o banco no construtor
  }

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.db) {
      return; // Já inicializado
    }

    try {
      // Determinar o caminho do banco de dados
      const dbPath = process.env['SQLITE_DB_PATH'] || path.join(process.cwd(), 'data', 'auth.db');
      
      // Criar diretório se não existir
      const dbDir = path.dirname(dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Inicializar banco de dados
      this.db = new Database(dbPath);
      
      // Configurar pragmas para melhor performance e compatibilidade
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('temp_store = MEMORY');

      logger.info(`Banco de dados SQLite inicializado: ${dbPath}`);
    } catch (error) {
      logger.error('Erro ao inicializar banco de dados SQLite:', error);
      throw error;
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
    }
    return this.db;
  }

  public async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) {
      throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
    }
    
    try {
      const stmt = this.db.prepare(sql);
      
      // Determinar se é uma query de seleção ou modificação
      const trimmedSql = sql.trim().toLowerCase();
      const isSelect = trimmedSql.startsWith('select') || 
                      trimmedSql.startsWith('with') ||
                      trimmedSql.startsWith('pragma');
      
      if (isSelect) {
        if (params.length === 0) {
          return stmt.all();
        } else {
          return stmt.all(...params);
        }
      } else {
        if (params.length === 0) {
          const result = stmt.run();
          return { 
            changes: result.changes, 
            lastInsertRowid: result.lastInsertRowid,
            rows: []
          };
        } else {
          const result = stmt.run(...params);
          return { 
            changes: result.changes, 
            lastInsertRowid: result.lastInsertRowid,
            rows: []
          };
        }
      }
    } catch (error) {
      logger.error('Erro na query SQLite:', { sql, params, error });
      throw error;
    }
  }

  public async transaction<T>(callback: () => T): Promise<T> {
    if (!this.db) {
      throw new Error('Banco de dados não foi inicializado. Chame initialize() primeiro.');
    }
    
    const transaction = this.db.transaction(callback);
    try {
      return transaction();
    } catch (error) {
      logger.error('Erro na transação SQLite:', error);
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT datetime(\'now\') as current_time');
      logger.info('Conexão com SQLite testada com sucesso:', result[0]);
      return true;
    } catch (error) {
      logger.error('Falha no teste de conexão com SQLite:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (!this.db) {
      return; // Já fechado ou nunca inicializado
    }
    
    try {
      this.db.close();
      this.db = null;
      logger.info('Conexão com SQLite fechada');
    } catch (error) {
      logger.error('Erro ao fechar conexão com SQLite:', error);
      throw error;
    }
  }

  // Método para executar migrações
  public async runMigration(sql: string): Promise<void> {
    try {
      await this.query(sql);
      logger.info('Migração executada com sucesso');
    } catch (error) {
      logger.error('Erro ao executar migração:', { sql, error });
      throw error;
    }
  }

  // Método para verificar se uma tabela existe
  public async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );
      return result.length > 0;
    } catch (error) {
      logger.error('Erro ao verificar existência da tabela:', { tableName, error });
      return false;
    }
  }

  // Método para obter informações da tabela
  public async getTableInfo(tableName: string): Promise<any[]> {
    try {
      return await this.query(`PRAGMA table_info(${tableName})`);
    } catch (error) {
      logger.error('Erro ao obter informações da tabela:', { tableName, error });
      throw error;
    }
  }
}

export const sqliteDb = SQLiteDatabase.getInstance();
export default sqliteDb;
