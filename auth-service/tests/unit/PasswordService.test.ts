import { PasswordService } from '../../src/services/PasswordService';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('deve gerar hash para senha válida', async () => {
      const password = 'Test123!@#';
      const hash = await passwordService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('deve gerar hashes diferentes para a mesma senha', async () => {
      const password = 'Test123!@#';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('deve verificar senha correta', async () => {
      const password = 'Test123!@#';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
      const password = 'Test123!@#';
      const wrongPassword = 'Wrong123!@#';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('deve aceitar senha forte', () => {
      const password = 'Test456!@#';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar senha muito curta', () => {
      const password = 'Test1!';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve ter pelo menos 8 caracteres');
    });

    it('deve rejeitar senha sem letra minúscula', () => {
      const password = 'TEST123!@#';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra minúscula');
    });

    it('deve rejeitar senha sem letra maiúscula', () => {
      const password = 'test123!@#';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
    });

    it('deve rejeitar senha sem número', () => {
      const password = 'TestABC!@#';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um número');
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const password = 'Test123ABC';
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
    });
  });

  describe('generateRandomPassword', () => {
    it('deve gerar senha com tamanho especificado', () => {
      const password = passwordService.generateRandomPassword(16);
      
      expect(password).toHaveLength(16);
    });

    it('deve gerar senha com tamanho padrão', () => {
      const password = passwordService.generateRandomPassword();
      
      expect(password).toHaveLength(12);
    });

    it('deve gerar senha válida', () => {
      const password = passwordService.generateRandomPassword();
      const result = passwordService.validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
    });
  });
});
