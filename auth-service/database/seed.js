"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = runSeeds;
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../src/utils/database");
const logger_1 = require("../src/utils/logger");
async function runSeeds() {
    try {
        logger_1.logger.info('Iniciando seeds do banco de dados...');
        const isConnected = await database_1.db.testConnection();
        if (!isConnected) {
            throw new Error('Falha na conexão com banco de dados');
        }
        const seeds = [
            'initial_data.sql'
        ];
        for (const seed of seeds) {
            try {
                logger_1.logger.info(`Executando seed: ${seed}`);
                const seedPath = (0, path_1.join)(__dirname, 'seeds', seed);
                const seedSQL = (0, fs_1.readFileSync)(seedPath, 'utf8');
                await database_1.db.query(seedSQL);
                logger_1.logger.info(`Seed ${seed} executado com sucesso`);
            }
            catch (error) {
                if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
                    logger_1.logger.warn(`Seed ${seed} já foi executado, pulando...`);
                    continue;
                }
                throw error;
            }
        }
        logger_1.logger.info('Todos os seeds foram executados com sucesso!');
    }
    catch (error) {
        logger_1.logger.error('Erro ao executar seeds:', error);
        process.exit(1);
    }
    finally {
        await database_1.db.close();
    }
}
if (require.main === module) {
    runSeeds();
}
//# sourceMappingURL=seed.js.map