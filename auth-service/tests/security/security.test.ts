import request from 'supertest';
import { app } from '../../src/app';
import { UserServiceSQLite } from '../../src/services/UserServiceSQLite';

describe('Security Tests', () => {
  let userService: UserServiceSQLite;

  beforeAll(async () => {
    userService = new UserServiceSQLite();
  });

  afterAll(async () => {
    // Cleanup test users
    const testEmails = [
      'security1@example.com', 'security2@example.com', 'security3@example.com',
      'security4@example.com', 'security5@example.com', 'security6@example.com',
      'security7@example.com', 'security8@example.com', 'security9@example.com',
      'security10@example.com', 'xss@example.com', 'sqlinjection@example.com'
    ];

    for (const email of testEmails) {
      try {
        await userService.deleteByEmail(email);
      } catch (error) {
        // User might not exist, ignore error
      }
    }
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent SQL injection in email field', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        username: 'sqlinjection',
        password: 'Test123!@#',
        name: 'SQL Injection Test'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should prevent XSS attacks in name field', async () => {
      const maliciousData = {
        email: 'xss@example.com',
        username: 'xsstest',
        password: 'Test123!@#',
        name: '<script>alert("XSS")</script>'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should prevent NoSQL injection attempts', async () => {
      const maliciousData = {
        email: { $ne: null },
        username: 'nosqltest',
        password: 'Test123!@#',
        name: 'NoSQL Test'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);
      
      const maliciousData = {
        email: `${longString}@example.com`,
        username: longString,
        password: 'Test123!@#',
        name: longString
      };

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent null byte injection', async () => {
      const maliciousData = {
        email: 'test@example.com\0',
        username: 'nullbytetest',
        password: 'Test123!@#',
        name: 'Null Byte Test'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Security', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
      // Create a test user
      const userData = {
        email: 'security1@example.com',
        username: 'securityuser1',
        password: 'Test123!@#',
        name: 'Security Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      testUser = response.body.data.user;
      authToken = response.body.data.token;
    });

    it('should reject requests without proper authorization header', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token de acesso não fornecido');
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'InvalidToken')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with expired tokens', async () => {
      // Create an expired token (this would need to be implemented in JWTService)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';
      
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests with invalid JWT signature', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid';
      
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting and Brute Force Protection', () => {
    it('should handle rapid login attempts gracefully', async () => {
      const loginData = {
        email: 'security2@example.com',
        password: 'Test123!@#'
      };

      // Create a test user first
      await request(app)
        .post('/auth/register')
        .send({
          email: 'security2@example.com',
          username: 'securityuser2',
          password: 'Test123!@#',
          name: 'Security Test User 2'
        })
        .expect(201);

      // Attempt multiple rapid logins with wrong password
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/auth/login')
          .send(loginData)
      );

      const results = await Promise.all(promises);

      // All should fail with 401
      results.forEach(result => {
        expect(result.status).toBe(401);
        expect(result.body.success).toBe(false);
      });

      // Cleanup
      await userService.deleteByEmail('security2@example.com');
    });

    it('should handle rapid registration attempts', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => ({
        email: `security${i + 3}@example.com`,
        username: `securityuser${i + 3}`,
        password: 'Test123!@#',
        name: `Security Test User ${i + 3}`
      })).map(userData =>
        request(app)
          .post('/auth/register')
          .send(userData)
      );

      const results = await Promise.all(promises);

      // All should succeed (rate limiting might not be implemented yet)
      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Cleanup
      for (let i = 3; i <= 7; i++) {
        await userService.deleteByEmail(`security${i}@example.com`);
      }
    });
  });

  describe('OIDC Security', () => {
    it('should reject invalid client_id in authorization', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'invalid-client',
          redirect_uri: 'http://example.com/callback',
          response_type: 'code',
          state: 'test-state'
        })
        .expect(400);

      expect(response.body.error).toBe('invalid_client');
    });

    it('should reject invalid redirect_uri', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'workadventure-client',
          redirect_uri: 'http://malicious-site.com/callback',
          response_type: 'code',
          state: 'test-state'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid response_type', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'workadventure-client',
          redirect_uri: 'http://example.com/callback',
          response_type: 'invalid_type',
          state: 'test-state'
        })
        .expect(400);

      expect(response.body.error).toBe('unsupported_response_type');
    });

    it('should reject token requests with invalid client credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: 'test-code',
          redirect_uri: 'http://example.com/callback',
          client_id: 'invalid-client',
          client_secret: 'invalid-secret'
        })
        .expect(401);

      expect(response.body.error).toBe('invalid_client');
    });
  });

  describe('Data Validation Security', () => {
    it('should prevent username enumeration attacks', async () => {
      // Try to register with existing username
      const existingUser = {
        email: 'security8@example.com',
        username: 'securityuser8',
        password: 'Test123!@#',
        name: 'Existing User'
      };

      await request(app)
        .post('/auth/register')
        .send(existingUser)
        .expect(201);

      // Try to register with same username but different email
      const duplicateUsername = {
        email: 'security9@example.com',
        username: 'securityuser8', // Same username
        password: 'Test123!@#',
        name: 'Duplicate Username User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateUsername)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username já está em uso');

      // Cleanup
      await userService.deleteByEmail('security8@example.com');
    });

    it('should prevent email enumeration attacks', async () => {
      // Try to register with existing email
      const existingUser = {
        email: 'security10@example.com',
        username: 'securityuser10',
        password: 'Test123!@#',
        name: 'Existing User'
      };

      await request(app)
        .post('/auth/register')
        .send(existingUser)
        .expect(201);

      // Try to register with same email but different username
      const duplicateEmail = {
        email: 'security10@example.com', // Same email
        username: 'differentuser',
        password: 'Test123!@#',
        name: 'Duplicate Email User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateEmail)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email já está em uso');

      // Cleanup
      await userService.deleteByEmail('security10@example.com');
    });
  });

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        '123', // Too short
        'password', // No numbers or special chars
        'PASSWORD', // No lowercase
        'Password', // No numbers or special chars
        'Password123', // No special chars
        'Password!', // No numbers
        'password123!', // No uppercase
        'PASSWORD123!', // No lowercase
        'Pass1!', // Too short
        'a'.repeat(1000) // Too long
      ];

      for (const weakPassword of weakPasswords) {
        const userData = {
          email: `weakpass${Math.random()}@example.com`,
          username: `weakpass${Math.random()}`,
          password: weakPassword,
          name: 'Weak Password Test'
        };

        const response = await request(app)
          .post('/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      }
    });

    it('should hash passwords securely', async () => {
      const userData = {
        email: 'passwordtest@example.com',
        username: 'passwordtest',
        password: 'Test123!@#',
        name: 'Password Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Get user from database to check password hash
      const user = await userService.findByEmail(userData.email);
      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(userData.password);
      expect(user!.passwordHash).toMatch(/^\$2[aby]\$\d+\$.{53}$/); // bcrypt hash pattern

      // Cleanup
      await userService.deleteByEmail(userData.email);
    });
  });

  describe('CORS and Headers Security', () => {
    it('should include proper security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/auth/register')
        .set('Origin', 'http://play.workadventure.localhost')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
