import request from 'supertest';
import app from '../../src/app';
import { sqliteDb } from '../../src/utils/sqlite-database';

describe('Auth Integration Tests - SQLite', () => {
  beforeAll(async () => {
    // Executar migrações antes dos testes
    try {
      await sqliteDb.runMigration(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          tags TEXT DEFAULT '[]',
          is_active INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          last_login_at TEXT
        );
      `);
    } catch (error) {
      console.error('Erro ao configurar banco de dados para testes:', error);
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    try {
      await sqliteDb.query('DELETE FROM users WHERE email LIKE ?', ['%test%']);
      await sqliteDb.close();
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await sqliteDb.query('DELETE FROM users WHERE email LIKE ?', ['%test%']);
    await sqliteDb.query('DELETE FROM users WHERE email LIKE ?', ['%example%']);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
        name: 'Test User',
        tags: ['developer']
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'Test123!@#',
        name: 'User 1'
      };

      // Primeiro registro
      await request(app)
        .post('/auth/register')
        .send(userData);

      // Segundo registro com mesmo email
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          username: 'user2'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email já está em uso');
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        email: 'user1@example.com',
        username: 'duplicateuser',
        password: 'Test123!@#',
        name: 'User 1'
      };

      // Primeiro registro
      await request(app)
        .post('/auth/register')
        .send(userData);

      // Segundo registro com mesmo username
      const response = await request(app)
        .post('/auth/register')
        .send({
          ...userData,
          email: 'user2@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username já está em uso');
    });

    it('should return error for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'Test123!@#',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      const userData = {
        email: 'login@example.com',
        username: 'loginuser',
        password: 'Test123!@#',
        name: 'Login User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test123!@#'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('connected');
    });
  });

  describe('GET /api/info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body.name).toBe('Auth Service');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.endpoints).toBeDefined();
    });
  });
});
