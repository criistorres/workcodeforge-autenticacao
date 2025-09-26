import request from 'supertest';
import { app } from '../../src/app';
import { UserServiceSQLite } from '../../src/services/UserServiceSQLite';

describe('Performance and Load Tests', () => {
  let userService: UserServiceSQLite;

  beforeAll(async () => {
    userService = new UserServiceSQLite();
  });

  afterAll(async () => {
    // Cleanup all test users
    const testEmails = [
      'perf1@example.com', 'perf2@example.com', 'perf3@example.com',
      'perf4@example.com', 'perf5@example.com', 'perf6@example.com',
      'perf7@example.com', 'perf8@example.com', 'perf9@example.com',
      'perf10@example.com'
    ];

    for (const email of testEmails) {
      try {
        await userService.deleteByEmail(email);
      } catch (error) {
        // User might not exist, ignore error
      }
    }
  });

  describe('Registration Performance', () => {
    it('should handle 10 concurrent registrations within 5 seconds', async () => {
      const startTime = Date.now();
      
      const users = Array.from({ length: 10 }, (_, i) => ({
        email: `perf${i + 1}@example.com`,
        username: `perfuser${i + 1}`,
        password: 'Test123!@#',
        name: `Performance User ${i + 1}`,
        tags: ['performance', 'test']
      }));

      const promises = users.map(userData =>
        request(app)
          .post('/auth/register')
          .send(userData)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All registrations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe(201);
        expect(result.body.success).toBe(true);
      });

      // Should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
      console.log(`10 concurrent registrations completed in ${totalTime}ms`);
    });

    it('should handle 50 sequential registrations within 30 seconds', async () => {
      const startTime = Date.now();
      
      const users = Array.from({ length: 50 }, (_, i) => ({
        email: `seq${i + 1}@example.com`,
        username: `sequser${i + 1}`,
        password: 'Test123!@#',
        name: `Sequential User ${i + 1}`
      }));

      for (const userData of users) {
        const response = await request(app)
          .post('/auth/register')
          .send(userData);
        
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 30 seconds
      expect(totalTime).toBeLessThan(30000);
      console.log(`50 sequential registrations completed in ${totalTime}ms`);

      // Cleanup
      for (const userData of users) {
        try {
          await userService.deleteByEmail(userData.email);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Login Performance', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
      // Create a test user for login tests
      const userData = {
        email: 'logintest@example.com',
        username: 'logintestuser',
        password: 'Test123!@#',
        name: 'Login Test User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      testUser = response.body.data.user;
      authToken = response.body.data.token;
    });

    afterAll(async () => {
      // Cleanup
      await userService.deleteByEmail(testUser.email);
    });

    it('should handle 20 concurrent logins within 3 seconds', async () => {
      const startTime = Date.now();
      
      const loginPromises = Array.from({ length: 20 }, () =>
        request(app)
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'Test123!@#'
          })
      );

      const results = await Promise.all(loginPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All logins should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
      console.log(`20 concurrent logins completed in ${totalTime}ms`);
    });

    it('should handle 100 sequential logins within 15 seconds', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'Test123!@#'
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 15 seconds
      expect(totalTime).toBeLessThan(15000);
      console.log(`100 sequential logins completed in ${totalTime}ms`);
    });
  });

  describe('Profile Access Performance', () => {
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
      // Create a test user for profile tests
      const userData = {
        email: 'profiletest@example.com',
        username: 'profiletestuser',
        password: 'Test123!@#',
        name: 'Profile Test User',
        tags: ['performance', 'test', 'profile']
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      testUser = response.body.data.user;
      authToken = response.body.data.token;
    });

    afterAll(async () => {
      // Cleanup
      await userService.deleteByEmail(testUser.email);
    });

    it('should handle 30 concurrent profile accesses within 2 seconds', async () => {
      const startTime = Date.now();
      
      const profilePromises = Array.from({ length: 30 }, () =>
        request(app)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const results = await Promise.all(profilePromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All profile accesses should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
      console.log(`30 concurrent profile accesses completed in ${totalTime}ms`);
    });
  });

  describe('OIDC Performance', () => {
    it('should handle 50 concurrent OIDC discovery requests within 1 second', async () => {
      const startTime = Date.now();
      
      const discoveryPromises = Array.from({ length: 50 }, () =>
        request(app)
          .get('/.well-known/openid_configuration')
      );

      const results = await Promise.all(discoveryPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All discovery requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.issuer).toBeDefined();
      });

      // Should complete within 1 second
      expect(totalTime).toBeLessThan(1000);
      console.log(`50 concurrent OIDC discovery requests completed in ${totalTime}ms`);
    });

    it('should handle 20 concurrent JWKS requests within 1 second', async () => {
      const startTime = Date.now();
      
      const jwksPromises = Array.from({ length: 20 }, () =>
        request(app)
          .get('/oauth/jwks')
      );

      const results = await Promise.all(jwksPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All JWKS requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.keys).toBeDefined();
      });

      // Should complete within 1 second
      expect(totalTime).toBeLessThan(1000);
      console.log(`20 concurrent JWKS requests completed in ${totalTime}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during multiple operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        const userData = {
          email: `memory${i}@example.com`,
          username: `memoryuser${i}`,
          password: 'Test123!@#',
          name: `Memory User ${i}`
        };

        // Register
        const registerResponse = await request(app)
          .post('/auth/register')
          .send(userData);
        
        expect(registerResponse.status).toBe(201);

        // Login
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });
        
        expect(loginResponse.status).toBe(200);

        // Profile access
        const profileResponse = await request(app)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${loginResponse.body.data.token}`);
        
        expect(profileResponse.status).toBe(200);

        // Cleanup
        await userService.deleteByEmail(userData.email);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase after 100 operations: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
  });
});
