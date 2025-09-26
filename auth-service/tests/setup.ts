import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configurar variáveis de ambiente para testes
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-secret-key-for-testing-only';
process.env['OIDC_ISSUER'] = 'http://test.workadventure.localhost';
process.env['OIDC_CLIENT_ID'] = 'test-client';
process.env['OIDC_CLIENT_SECRET'] = 'test-secret';
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/workcode_test';

// Configurar timeout global para testes
jest.setTimeout(10000);

// Mock do logger para testes
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));
