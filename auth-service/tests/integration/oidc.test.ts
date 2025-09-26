import request from 'supertest';
import app from '../../src/app';

describe('OIDC Integration Tests', () => {
  describe('GET /.well-known/openid_configuration', () => {
    it('should return OIDC discovery configuration', async () => {
      const response = await request(app)
        .get('/.well-known/openid_configuration')
        .expect(200);

      expect(response.body).toHaveProperty('issuer');
      expect(response.body).toHaveProperty('authorization_endpoint');
      expect(response.body).toHaveProperty('token_endpoint');
      expect(response.body).toHaveProperty('userinfo_endpoint');
      expect(response.body).toHaveProperty('jwks_uri');
      expect(response.body).toHaveProperty('response_types_supported');
      expect(response.body).toHaveProperty('grant_types_supported');
      expect(response.body).toHaveProperty('scopes_supported');
      expect(response.body).toHaveProperty('claims_supported');
    });

    it('should include correct issuer URL', async () => {
      const response = await request(app)
        .get('/.well-known/openid_configuration')
        .expect(200);

      expect(response.body.issuer).toBe(process.env['OIDC_ISSUER']);
    });
  });

  describe('GET /oauth/authorize', () => {
    it('should return error for missing parameters', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_request');
    });

    it('should return error for invalid client_id', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'invalid-client',
          redirect_uri: 'http://example.com/callback',
          response_type: 'code',
          state: 'test-state'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_client');
    });

    it('should redirect to login for valid parameters without user session', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: process.env['OIDC_CLIENT_ID'],
          redirect_uri: 'http://example.com/callback',
          response_type: 'code',
          state: 'test-state'
        })
        .expect(302);

      expect(response.headers['location']).toContain('/login');
      expect(response.headers['location']).toContain('redirect_uri=');
      expect(response.headers['location']).toContain('state=test-state');
    });
  });

  describe('POST /oauth/token', () => {
    it('should return error for invalid client credentials', async () => {
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

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_client');
    });

    it('should return error for invalid grant type', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'invalid_grant',
          client_id: process.env['OIDC_CLIENT_ID'],
          client_secret: process.env['OIDC_CLIENT_SECRET']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_request');
    });
  });

  describe('GET /oauth/userinfo', () => {
    it('should return error for missing token', async () => {
      const response = await request(app)
        .get('/oauth/userinfo')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_token');
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/oauth/userinfo')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('invalid_token');
    });
  });

  describe('GET /oauth/jwks', () => {
    it('should return JWKS keys', async () => {
      const response = await request(app)
        .get('/oauth/jwks')
        .expect(200);

      expect(response.body).toHaveProperty('keys');
      expect(Array.isArray(response.body.keys)).toBe(true);
      expect(response.body.keys.length).toBeGreaterThan(0);
      
      const key = response.body.keys[0];
      expect(key).toHaveProperty('kty');
      expect(key).toHaveProperty('use');
      expect(key).toHaveProperty('kid');
      expect(key).toHaveProperty('alg');
    });
  });
});
