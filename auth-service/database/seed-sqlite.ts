import { sqliteDb } from '../src/utils/sqlite-database';
import { logger } from '../src/utils/logger';
import bcrypt from 'bcrypt';

async function runSeeds() {
  try {
    logger.info('Iniciando seeds do SQLite...');

    // Verificar se a tabela users existe
    const usersExists = await sqliteDb.tableExists('users');
    if (!usersExists) {
      logger.error('Tabela users não existe. Execute as migrações primeiro.');
      process.exit(1);
    }

    // Verificar se já existem usuários
    const existingUsers = await sqliteDb.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      logger.info('Usuários já existem no banco. Pulando seeds.');
      return;
    }

    // Criar usuário de teste
    const testUser = {
      id: 'test-user-001',
      email: 'test@workadventure.localhost',
      username: 'testuser',
      password: 'Test123!@#',
      name: 'Usuário de Teste',
      tags: JSON.stringify(['developer', 'tester'])
    };

    // Hash da senha
    const passwordHash = await bcrypt.hash(testUser.password, 12);

    // Inserir usuário de teste
    await sqliteDb.query(`
      INSERT INTO users (id, email, username, password_hash, name, tags, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      testUser.id,
      testUser.email,
      testUser.username,
      passwordHash,
      testUser.name,
      testUser.tags,
      1
    ]);

    logger.info('Usuário de teste criado:', {
      id: testUser.id,
      email: testUser.email,
      username: testUser.username
    });

    // Criar usuário admin
    const adminUser = {
      id: 'admin-user-001',
      email: 'admin@workadventure.localhost',
      username: 'admin',
      password: 'Admin123!@#',
      name: 'Administrador',
      tags: JSON.stringify(['admin', 'developer'])
    };

    const adminPasswordHash = await bcrypt.hash(adminUser.password, 12);

    await sqliteDb.query(`
      INSERT INTO users (id, email, username, password_hash, name, tags, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      adminUser.id,
      adminUser.email,
      adminUser.username,
      adminPasswordHash,
      adminUser.name,
      adminUser.tags,
      1
    ]);

    logger.info('Usuário admin criado:', {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username
    });

    logger.info('Seeds executados com sucesso!');

  } catch (error) {
    logger.error('Erro ao executar seeds:', error);
    process.exit(1);
  } finally {
    await sqliteDb.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runSeeds();
}

export { runSeeds };
