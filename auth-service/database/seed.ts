import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../src/utils/database';
import { logger } from '../src/utils/logger';

async function runSeeds() {
  try {
    logger.info('Iniciando seeds do banco de dados...');

    // Testar conexão
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Falha na conexão com banco de dados');
    }

    // Lista de seeds em ordem
    const seeds = [
      'initial_data.sql'
    ];

    for (const seed of seeds) {
      try {
        logger.info(`Executando seed: ${seed}`);
        
        const seedPath = join(__dirname, 'seeds', seed);
        const seedSQL = readFileSync(seedPath, 'utf8');
        
        await db.query(seedSQL);
        
        logger.info(`Seed ${seed} executado com sucesso`);
      } catch (error: any) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          logger.warn(`Seed ${seed} já foi executado, pulando...`);
          continue;
        }
        throw error;
      }
    }

    logger.info('Todos os seeds foram executados com sucesso!');
  } catch (error) {
    logger.error('Erro ao executar seeds:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
