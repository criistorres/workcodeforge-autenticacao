import request from 'supertest';
import app from '../../src/app';
import { sqliteDb } from '../../src/utils/sqlite-database';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Limpar banco de dados antes dos testes
    await sqliteDb.query('DELETE FROM users WHERE email LIKE ?', ['test%']);
  });

  afterAll(async () => {
    // Limpar banco de dados após os testes
    await sqliteDb.query('DELETE FROM users WHERE email LIKE ?', ['test%']);
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
      expect(response.body.message).toBe('Usuário criado com sucesso');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com', // Same email as previous test
        username: 'testuser2',
        password: 'Test123!@#',
        name: 'Test User 2'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email já está em uso');
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        email: 'test2@example.com',
        username: 'testuser', // Same username as previous test
        password: 'Test123!@#',
        name: 'Test User 3'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username já está em uso');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab', // Too short
        password: '123', // Too weak
        name: '' // Empty name
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dados inválidos');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Criar usuário para teste de login
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
      const loginData = {
        email: 'login@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Criar usuário e fazer login
      const userData = {
        email: 'profile@example.com',
        username: 'profileuser',
        password: 'Test123!@#',
        name: 'Profile User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'Test123!@#'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile@example.com');
      expect(response.body.data.username).toBe('profileuser');
      expect(response.body.data.name).toBe('Profile User');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token de acesso requerido');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token inválido');
    });
  });

  describe('PUT /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Criar usuário e fazer login
      const userData = {
        email: 'update@example.com',
        username: 'updateuser',
        password: 'Test123!@#',
        name: 'Update User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'update@example.com',
          password: 'Test123!@#'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        tags: ['developer', 'tester']
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil atualizado com sucesso');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.tags).toEqual(['developer', 'tester']);
    });

    it('should return error for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'] // Too many tags
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dados inválidos');
    });
  });

  describe('POST /auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Criar usuário e fazer login
      const userData = {
        email: 'password@example.com',
        username: 'passworduser',
        password: 'Test123!@#',
        name: 'Password User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'password@example.com',
          password: 'Test123!@#'
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should change password with valid current password', async () => {
      const changeData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewPassword123!@#'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Senha alterada com sucesso');
    });

    it('should return error for wrong current password', async () => {
      const changeData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!@#'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Senha atual incorreta');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Criar usuário e fazer login
      const userData = {
        email: 'refresh@example.com',
        username: 'refreshuser',
        password: 'Test123!@#',
        name: 'Refresh User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Test123!@#'
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token renovado com sucesso');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token fornecido não é um refresh token');
    });
  });
});
