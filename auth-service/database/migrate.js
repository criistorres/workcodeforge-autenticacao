"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../src/utils/database");
const logger_1 = require("../src/utils/logger");
async function runMigrations() {
    try {
        logger_1.logger.info('Iniciando migrações do banco de dados...');
        const isConnected = await database_1.db.testConnection();
        if (!isConnected) {
            throw new Error('Falha na conexão com banco de dados');
        }
        const migrations = [
            '001_create_users_table.sql'
        ];
        for (const migration of migrations) {
            try {
                logger_1.logger.info(`Executando migração: ${migration}`);
                const migrationPath = (0, path_1.join)(__dirname, 'migrations', migration);
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await database_1.db.query(migrationSQL);
                logger_1.logger.info(`Migração ${migration} executada com sucesso`);
            }
            catch (error) {
                if (error.message.includes('already exists')) {
                    logger_1.logger.warn(`Migração ${migration} já foi executada, pulando...`);
                    continue;
                }
                throw error;
            }
        }
        logger_1.logger.info('Todas as migrações foram executadas com sucesso!');
    }
    catch (error) {
        logger_1.logger.error('Erro ao executar migrações:', error);
        process.exit(1);
    }
    finally {
        await database_1.db.close();
    }
}
if (require.main === module) {
    runMigrations();
}
//# sourceMappingURL=migrate.js.map