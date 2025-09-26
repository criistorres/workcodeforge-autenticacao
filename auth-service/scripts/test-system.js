#!/usr/bin/env node

/**
 * Script de teste seguro para verificar o sistema sem iniciar servidor
 * Este script testa componentes individuais sem travar a máquina
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

console.log('🔍 Testando sistema Auth Service...\n');

// 1. Verificar compilação TypeScript
console.log('1️⃣ Verificando compilação TypeScript...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Compilação TypeScript: OK\n');
} catch (error) {
  console.log('❌ Erro na compilação TypeScript:');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// 2. Verificar arquivo de banco
console.log('2️⃣ Verificando arquivo de banco SQLite...');
const dbPath = path.join(__dirname, '..', 'data', 'auth.db');
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log(`✅ Arquivo de banco existe: ${dbPath}`);
  console.log(`   Tamanho: ${stats.size} bytes`);
  console.log(`   Modificado: ${stats.mtime}\n`);
} else {
  console.log('❌ Arquivo de banco não encontrado');
  console.log('   Executando migrações...');
  try {
    execSync('npm run db:migrate-sqlite', { stdio: 'pipe' });
    console.log('✅ Migrações executadas com sucesso\n');
  } catch (error) {
    console.log('❌ Erro nas migrações:');
    console.log(error.stdout?.toString() || error.message);
  }
}

// 3. Testar conexão SQLite diretamente
console.log('3️⃣ Testando conexão SQLite...');
try {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  
  // Teste básico
  const result = db.prepare('SELECT 1 as test').get();
  console.log('✅ Conexão SQLite básica: OK');
  
  // Teste de data/hora
  const timeResult = db.prepare('SELECT datetime(\'now\') as current_time').get();
  console.log(`✅ Query de data/hora: ${timeResult.current_time}`);
  
  // Verificar tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`✅ Tabelas encontradas: ${tables.length}`);
  tables.forEach(table => console.log(`   - ${table.name}`));
  
  db.close();
  console.log('✅ Conexão SQLite: OK\n');
} catch (error) {
  console.log('❌ Erro na conexão SQLite:');
  console.log(error.message);
}

// 4. Verificar variáveis de ambiente
console.log('4️⃣ Verificando variáveis de ambiente...');
const requiredEnvVars = [
  'JWT_SECRET',
  'OIDC_ISSUER',
  'OIDC_CLIENT_ID',
  'OIDC_CLIENT_SECRET'
];

let envOk = true;
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: definida`);
  } else {
    console.log(`❌ ${envVar}: não definida`);
    envOk = false;
  }
});

if (envOk) {
  console.log('✅ Variáveis de ambiente: OK\n');
} else {
  console.log('⚠️  Algumas variáveis de ambiente não estão definidas\n');
}

// 5. Executar testes unitários
console.log('5️⃣ Executando testes unitários...');
try {
  execSync('npm test -- --testNamePattern="PasswordService|JWTService"', { stdio: 'pipe' });
  console.log('✅ Testes unitários: OK\n');
} catch (error) {
  console.log('❌ Erro nos testes unitários:');
  console.log(error.stdout?.toString() || error.message);
}

// 6. Verificar portas
console.log('6️⃣ Verificando portas...');
try {
  const port3000 = execSync('lsof -i :3000', { stdio: 'pipe' }).toString();
  if (port3000.trim()) {
    console.log('⚠️  Porta 3000 em uso:');
    console.log(port3000);
  } else {
    console.log('✅ Porta 3000: livre');
  }
  
  const port3001 = execSync('lsof -i :3001', { stdio: 'pipe' }).toString();
  if (port3001.trim()) {
    console.log('⚠️  Porta 3001 em uso:');
    console.log(port3001);
  } else {
    console.log('✅ Porta 3001: livre');
  }
} catch (error) {
  // lsof retorna código de saída 1 quando não encontra processos
  console.log('✅ Portas 3000 e 3001: livres');
}

console.log('\n🎉 Teste do sistema concluído!');
console.log('💡 Para iniciar o servidor, use: PORT=3001 npm run dev');
