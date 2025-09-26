import request from 'supertest';
import { app } from '../../src/app';
import { UserServiceSQLite } from '../../src/services/UserServiceSQLite';
import { PasswordService } from '../../src/services/PasswordService';
import { JWTService } from '../../src/services/JWTService';

describe('E2E Auth Flow Tests', () => {
  let userService: UserServiceSQLite;
  let passwordService: PasswordService;
  let jwtService: JWTService;

  beforeAll(async () => {
    userService = new UserServiceSQLite();
    passwordService = new PasswordService();
    jwtService = new JWTService();
  });

  afterAll(async () => {
    // Cleanup - remove test users
    try {
      await userService.deleteByEmail('e2e-test@example.com');
    } catch (error) {
      // User might not exist, ignore error
    }
  });

  describe('Complete Registration and Login Flow', () => {
    it('should complete full registration flow', async () => {
      const userData = {
        email: 'e2e-test@example.com',
        username: 'e2etestuser',
        password: 'Test123!@#',
        name: 'E2E Test User',
        tags: ['developer', 'tester']
      };

      // 1. Register user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data.token).toBeDefined();
      expect(registerResponse.body.data.refreshToken).toBeDefined();

      // 2. Login with registered user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(userData.email);
      expect(loginResponse.body.data.token).toBeDefined();

      // 3. Get profile with token
      const profileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(userData.email);
      expect(profileResponse.body.data.tags).toEqual(userData.tags);
    });

    it('should handle duplicate registration attempts', async () => {
      const userData = {
        email: 'duplicate-test@example.com',
        username: 'duplicatetest',
        password: 'Test123!@#',
        name: 'Duplicate Test User'
      };

      // First registration should succeed
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const duplicateResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toBe('Email já está em uso');

      // Cleanup
      await userService.deleteByEmail(userData.email);
    });

    it('should handle invalid login credentials', async () => {
      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Credenciais inválidas');
    });
  });

  describe('OIDC Flow Tests', () => {
    it('should complete OIDC discovery flow', async () => {
      const response = await request(app)
        .get('/.well-known/openid_configuration')
        .expect(200);

      expect(response.body.issuer).toBeDefined();
      expect(response.body.authorization_endpoint).toBeDefined();
      expect(response.body.token_endpoint).toBeDefined();
      expect(response.body.userinfo_endpoint).toBeDefined();
      expect(response.body.jwks_uri).toBeDefined();
      expect(response.body.scopes_supported).toContain('openid');
      expect(response.body.scopes_supported).toContain('profile');
      expect(response.body.scopes_supported).toContain('email');
    });

    it('should handle OIDC authorization flow', async () => {
      const authParams = {
        client_id: 'workadventure-client',
        redirect_uri: 'http://example.com/callback',
        response_type: 'code',
        state: 'test-state-123',
        scope: 'openid profile email'
      };

      const response = await request(app)
        .get('/oauth/authorize')
        .query(authParams)
        .expect(302);

      // Should redirect to login page
      expect(response.headers.location).toContain('/login.html');
    });

    it('should handle invalid OIDC client', async () => {
      const invalidAuthParams = {
        client_id: 'invalid-client',
        redirect_uri: 'http://example.com/callback',
        response_type: 'code',
        state: 'test-state-123'
      };

      const response = await request(app)
        .get('/oauth/authorize')
        .query(invalidAuthParams)
        .expect(400);

      expect(response.body.error).toBe('invalid_client');
    });
  });

  describe('Profile Management Flow', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
      // Create test user
      const userData = {
        email: 'profile-test@example.com',
        username: 'profiletest',
        password: 'Test123!@#',
        name: 'Profile Test User',
        tags: ['developer']
      };

      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      testUser = registerResponse.body.data.user;
      authToken = registerResponse.body.data.token;
    });

    afterAll(async () => {
      // Cleanup
      await userService.deleteByEmail(testUser.email);
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Profile Test User',
        tags: ['developer', 'senior', 'fullstack']
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.tags).toEqual(updateData.tags);
    });

    it('should change user password', async () => {
      const passwordData = {
        currentPassword: 'Test123!@#',
        newPassword: 'NewTest123!@#'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Senha alterada com sucesso');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: passwordData.newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        email: 'incomplete@example.com'
        // Missing other required fields
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle invalid email format', async () => {
      const invalidEmailData = {
        email: 'not-an-email',
        username: 'testuser',
        password: 'Test123!@#',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle weak passwords', async () => {
      const weakPasswordData = {
        email: 'weakpass@example.com',
        username: 'weakpassuser',
        password: '123', // Too weak
        name: 'Weak Password User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle multiple concurrent registrations', async () => {
      const concurrentUsers = Array.from({ length: 5 }, (_, i) => ({
        email: `concurrent${i}@example.com`,
        username: `concurrentuser${i}`,
        password: 'Test123!@#',
        name: `Concurrent User ${i}`
      }));

      const promises = concurrentUsers.map(userData =>
        request(app)
          .post('/auth/register')
          .send(userData)
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Cleanup
      const cleanupPromises = concurrentUsers.map(userData =>
        userService.deleteByEmail(userData.email)
      );
      await Promise.all(cleanupPromises);
    });

    it('should handle rapid login attempts', async () => {
      // Create a test user first
      const userData = {
        email: 'rapidlogin@example.com',
        username: 'rapidloginuser',
        password: 'Test123!@#',
        name: 'Rapid Login User'
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Attempt multiple rapid logins
      const loginPromises = Array.from({ length: 3 }, () =>
        request(app)
          .post('/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          })
      );

      const results = await Promise.all(loginPromises);

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Cleanup
      await userService.deleteByEmail(userData.email);
    });
  });
});
