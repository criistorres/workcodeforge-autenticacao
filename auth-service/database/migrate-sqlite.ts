import { sqliteDb } from '../src/utils/sqlite-database';
import { logger } from '../src/utils/logger';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    logger.info('Iniciando migrações do SQLite...');

    // Verificar se o diretório de migrações existe
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.error('Diretório de migrações não encontrado:', migrationsDir);
      process.exit(1);
    }

    // Listar arquivos de migração
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sqlite.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.warn('Nenhuma migração SQLite encontrada');
      return;
    }

    logger.info(`Encontradas ${migrationFiles.length} migrações SQLite`);

    // Executar cada migração
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      logger.info(`Executando migração: ${file}`);
      
      // Dividir SQL em declarações individuais
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      // Executar cada declaração separadamente
      for (const statement of statements) {
        if (statement.trim()) {
          await sqliteDb.runMigration(statement);
        }
      }
      
      logger.info(`Migração ${file} executada com sucesso`);
    }

    logger.info('Todas as migrações foram executadas com sucesso!');

  } catch (error) {
    logger.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await sqliteDb.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
