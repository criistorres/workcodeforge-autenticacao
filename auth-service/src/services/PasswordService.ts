import * as bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Gera hash da senha usando bcrypt
   * @param password Senha em texto plano
   * @returns Promise<string> Hash da senha
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      logger.debug('Hash de senha gerado com sucesso');
      return hash;
    } catch (error) {
      logger.error('Erro ao gerar hash da senha:', error);
      throw new Error('Falha ao processar senha');
    }
  }

  /**
   * Verifica se a senha corresponde ao hash
   * @param password Senha em texto plano
   * @param hash Hash armazenado
   * @returns Promise<boolean> True se a senha estiver correta
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);
      logger.debug('Verificação de senha realizada', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Erro ao verificar senha:', error);
      throw new Error('Falha ao verificar senha');
    }
  }

  /**
   * Valida a força da senha
   * @param password Senha a ser validada
   * @returns Objeto com resultado da validação
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
    }
    
    // Verificar se não contém sequências comuns
    const commonSequences = ['123', 'abc', 'qwe', 'asd', 'zxc'];
    const lowerPassword = password.toLowerCase();
    for (const sequence of commonSequences) {
      if (lowerPassword.includes(sequence)) {
        errors.push('Senha não deve conter sequências comuns');
        break;
      }
    }
    
    // Verificar se não é muito simples
    if (password === password.toLowerCase() || password === password.toUpperCase()) {
      errors.push('Senha deve conter uma mistura de letras maiúsculas e minúsculas');
    }
    
    const result = {
      isValid: errors.length === 0,
      errors
    };
    
    logger.debug('Validação de força da senha realizada', result);
    return result;
  }

  /**
   * Gera uma senha aleatória segura
   * @param length Tamanho da senha (padrão: 12)
   * @returns Senha aleatória
   */
  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    // Garantir pelo menos um caractere de cada tipo
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minúscula
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // maiúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // número
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // especial
    
    // Preencher o resto aleatoriamente
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const passwordService = new PasswordService();
export default passwordService;
