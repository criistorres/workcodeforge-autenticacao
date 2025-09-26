import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../src/utils/database';
import { logger } from '../src/utils/logger';

async function runMigrations() {
  try {
    logger.info('Iniciando migrações do banco de dados...');

    // Testar conexão
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Falha na conexão com banco de dados');
    }

    // Lista de migrações em ordem
    const migrations = [
      '001_create_users_table.sql'
    ];

    for (const migration of migrations) {
      try {
        logger.info(`Executando migração: ${migration}`);
        
        const migrationPath = join(__dirname, 'migrations', migration);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        await db.query(migrationSQL);
        
        logger.info(`Migração ${migration} executada com sucesso`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          logger.warn(`Migração ${migration} já foi executada, pulando...`);
          continue;
        }
        throw error;
      }
    }

    logger.info('Todas as migrações foram executadas com sucesso!');
  } catch (error) {
    logger.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
