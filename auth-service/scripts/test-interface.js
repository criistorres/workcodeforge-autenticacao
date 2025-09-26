#!/usr/bin/env node

/**
 * Script de teste para interface de usuário
 * Testa todas as páginas HTML e funcionalidades JavaScript
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const TEST_PAGES = [
  '/',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/forgot-password.html',
  '/oidc-redirect.html'
];

const TEST_FILES = [
  '/css/style.css',
  '/js/auth.js'
];

console.log('🧪 Testando Interface de Usuário - Fase 5');
console.log('==========================================\n');

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Função para testar página HTML
async function testPage(url) {
  try {
    const response = await makeRequest(`${BASE_URL}${url}`);
    
    if (response.status === 200) {
      // Verificar se é HTML
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.log(`✅ ${url} - OK (${response.status})`);
        
        // Verificar se contém elementos essenciais
        const html = response.data;
        if (html.includes('<html') && html.includes('</html>')) {
          console.log(`   📄 HTML válido`);
        } else {
          console.log(`   ⚠️  HTML pode estar incompleto`);
        }
        
        // Verificar se contém CSS e JS
        if (html.includes('style.css')) {
          console.log(`   🎨 CSS referenciado`);
        }
        if (html.includes('auth.js')) {
          console.log(`   📜 JavaScript referenciado`);
        }
        
        return true;
      } else {
        console.log(`❌ ${url} - Tipo de conteúdo incorreto: ${contentType}`);
        return false;
      }
    } else {
      console.log(`❌ ${url} - Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${url} - Erro: ${error.message}`);
    return false;
  }
}

// Função para testar arquivo estático
async function testStaticFile(url) {
  try {
    const response = await makeRequest(`${BASE_URL}${url}`);
    
    if (response.status === 200) {
      console.log(`✅ ${url} - OK (${response.status})`);
      
      // Verificar tamanho do arquivo
      const size = response.data.length;
      console.log(`   📊 Tamanho: ${size} bytes`);
      
      return true;
    } else {
      console.log(`❌ ${url} - Erro ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${url} - Erro: ${error.message}`);
    return false;
  }
}

// Função para testar API de autenticação
async function testAuthAPI() {
  console.log('\n🔐 Testando API de Autenticação');
  console.log('--------------------------------');
  
  try {
    // Testar health check
    const healthResponse = await makeRequest(`${BASE_URL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ /health - OK');
      const health = JSON.parse(healthResponse.data);
      console.log(`   📊 Status: ${health.status}`);
      console.log(`   🗄️  Database: ${health.database}`);
    } else {
      console.log('❌ /health - Erro');
    }
    
    // Testar info da API
    const infoResponse = await makeRequest(`${BASE_URL}/api/info`);
    if (infoResponse.status === 200) {
      console.log('✅ /api/info - OK');
      const info = JSON.parse(infoResponse.data);
      console.log(`   📚 Nome: ${info.name}`);
      console.log(`   🔢 Versão: ${info.version}`);
    } else {
      console.log('❌ /api/info - Erro');
    }
    
    // Testar discovery OIDC
    const discoveryResponse = await makeRequest(`${BASE_URL}/.well-known/openid_configuration`);
    if (discoveryResponse.status === 200) {
      console.log('✅ /.well-known/openid_configuration - OK');
      const discovery = JSON.parse(discoveryResponse.data);
      console.log(`   🔗 Issuer: ${discovery.issuer}`);
      console.log(`   🎯 Scopes: ${discovery.scopes_supported?.join(', ')}`);
    } else {
      console.log('❌ /.well-known/openid_configuration - Erro');
    }
    
  } catch (error) {
    console.log(`❌ Erro ao testar API: ${error.message}`);
  }
}

// Função principal de teste
async function runTests() {
  console.log('📄 Testando Páginas HTML');
  console.log('------------------------');
  
  let pageResults = [];
  for (const page of TEST_PAGES) {
    const result = await testPage(page);
    pageResults.push(result);
  }
  
  console.log('\n📁 Testando Arquivos Estáticos');
  console.log('-------------------------------');
  
  let fileResults = [];
  for (const file of TEST_FILES) {
    const result = await testStaticFile(file);
    fileResults.push(result);
  }
  
  // Testar API
  await testAuthAPI();
  
  // Resumo dos resultados
  console.log('\n📊 Resumo dos Testes');
  console.log('====================');
  
  const totalPages = TEST_PAGES.length;
  const passedPages = pageResults.filter(r => r).length;
  const totalFiles = TEST_FILES.length;
  const passedFiles = fileResults.filter(r => r).length;
  
  console.log(`📄 Páginas HTML: ${passedPages}/${totalPages} passaram`);
  console.log(`📁 Arquivos Estáticos: ${passedFiles}/${totalFiles} passaram`);
  
  const totalTests = totalPages + totalFiles;
  const totalPassed = passedPages + passedFiles;
  const successRate = Math.round((totalPassed / totalTests) * 100);
  
  console.log(`\n🎯 Taxa de Sucesso: ${successRate}% (${totalPassed}/${totalTests})`);
  
  if (successRate >= 90) {
    console.log('🎉 Interface implementada com sucesso!');
    process.exit(0);
  } else if (successRate >= 70) {
    console.log('⚠️  Interface implementada com alguns problemas');
    process.exit(1);
  } else {
    console.log('❌ Interface com problemas significativos');
    process.exit(1);
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    await makeRequest(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Executar testes
async function main() {
  console.log('🔍 Verificando se o servidor está rodando...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Servidor não está rodando!');
    console.log('   Execute: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Servidor está rodando\n');
  
  await runTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testPage, testStaticFile, testAuthAPI };
