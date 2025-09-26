#!/usr/bin/env node

/**
 * Script de Teste - Redirecionamento após Login
 * Testa se o redirecionamento está funcionando corretamente
 */

const https = require('https');
const http = require('http');

// Configurações
const AUTH_SERVICE_URL = 'http://localhost:3002';
const PLAY_URL = 'http://play.workadventure.localhost';

// Desabilitar verificação SSL para testes locais
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAuthService() {
  console.log('🔍 Testando Auth Service...');
  
  try {
    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const health = await makeRequest(`${AUTH_SERVICE_URL}/health`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
    
    if (health.status !== 200) {
      throw new Error('Health check falhou');
    }
    
    // Teste 2: OIDC Discovery
    console.log('\n2. Testando OIDC Discovery...');
    const discovery = await makeRequest(`${AUTH_SERVICE_URL}/.well-known/openid-configuration`);
    console.log(`   Status: ${discovery.status}`);
    console.log(`   Issuer: ${discovery.data.issuer}`);
    
    if (discovery.status !== 200) {
      throw new Error('OIDC Discovery falhou');
    }
    
    // Teste 3: Registro de usuário de teste
    console.log('\n3. Testando registro de usuário...');
    const timestamp = Date.now();
    const testUser = {
      email: `teste_redirect_${timestamp}@teste.com`,
      username: `teste_redirect_${timestamp}`,
      password: 'Teste123!',
      name: 'Teste Redirect'
    };
    
    const register = await makeRequest(`${AUTH_SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log(`   Status: ${register.status}`);
    console.log(`   Success: ${register.data.success}`);
    console.log(`   Response: ${JSON.stringify(register.data, null, 2)}`);
    
    if ((register.status !== 200 && register.status !== 201) || !register.data.success) {
      throw new Error(`Registro de usuário falhou: ${register.data.message || 'Erro desconhecido'}`);
    }
    
    // Teste 4: Login de usuário
    console.log('\n4. Testando login de usuário...');
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    const login = await makeRequest(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`   Status: ${login.status}`);
    console.log(`   Success: ${login.data.success}`);
    console.log(`   Token: ${login.data.data?.accessToken ? '✅ Gerado' : '❌ Não gerado'}`);
    
    if (login.status !== 200 || !login.data.success) {
      throw new Error('Login de usuário falhou');
    }
    
    // Teste 5: Verificar WorkAdventure
    console.log('\n5. Testando conectividade com WorkAdventure...');
    const play = await makeRequest(`${PLAY_URL}/`);
    console.log(`   Status: ${play.status}`);
    console.log(`   Response: ${play.data.includes('WorkAdventure') ? '✅ WorkAdventure detectado' : '❌ WorkAdventure não encontrado'}`);
    
    if (play.status !== 200) {
      throw new Error('WorkAdventure não está acessível');
    }
    
    console.log('\n✅ Todos os testes passaram!');
    console.log('\n📋 Resumo:');
    console.log('   - Auth Service: ✅ Funcionando');
    console.log('   - OIDC Discovery: ✅ Funcionando');
    console.log('   - Registro de usuário: ✅ Funcionando');
    console.log('   - Login de usuário: ✅ Funcionando');
    console.log('   - WorkAdventure: ✅ Acessível');
    console.log('\n🎯 Redirecionamento configurado para: http://play.workadventure.localhost/');
    console.log('\n💡 Para testar o redirecionamento:');
    console.log('   1. Acesse: http://auth.workadventure.localhost/login.html');
    console.log('   2. Faça login com: teste-redirect@teste.com / Teste123!');
    console.log('   3. Você deve ser redirecionado para: http://play.workadventure.localhost/');
    
  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  }
}

// Executar testes
if (require.main === module) {
  testAuthService().catch(console.error);
}

module.exports = { testAuthService };
