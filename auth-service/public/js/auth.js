/**
 * Sistema de Autenticação - Frontend
 * Funcionalidades de validação, interação e comunicação com API
 */

class AuthApp {
  constructor() {
    this.apiBase = window.location.origin;
    this.currentUser = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
    this.setupFormValidation();
  }

  setupEventListeners() {
    // Event listeners para formulários
    const forms = document.querySelectorAll('form[data-auth-form]');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    });

    // Event listeners para inputs com validação em tempo real
    const inputs = document.querySelectorAll('input[data-validate]');
    inputs.forEach(input => {
      input.addEventListener('blur', (e) => this.validateField(e.target));
      input.addEventListener('input', (e) => this.clearFieldError(e.target));
    });

    // Event listeners para botões de ação
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
    }

    // Event listeners para tags
    this.setupTagHandlers();
  }

  setupFormValidation() {
    // Validação de email
    this.validators.email = (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Email deve ter formato válido';
    };

    // Validação de senha
    this.validators.password = (value) => {
      if (value.length < 8) {
        return 'Senha deve ter pelo menos 8 caracteres';
      }
      if (!/(?=.*[a-z])/.test(value)) {
        return 'Senha deve conter pelo menos uma letra minúscula';
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return 'Senha deve conter pelo menos uma letra maiúscula';
      }
      if (!/(?=.*\d)/.test(value)) {
        return 'Senha deve conter pelo menos um número';
      }
      if (!/(?=.*[@$!%*?&])/.test(value)) {
        return 'Senha deve conter pelo menos um caractere especial (@$!%*?&)';
      }
      return null;
    };

    // Validação de username
    this.validators.username = (value) => {
      if (value.length < 3) {
        return 'Username deve ter pelo menos 3 caracteres';
      }
      if (value.length > 30) {
        return 'Username deve ter no máximo 30 caracteres';
      }
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username deve conter apenas letras, números e underscore';
      }
      return null;
    };

    // Validação de nome
    this.validators.name = (value) => {
      if (value.length < 2) {
        return 'Nome deve ter pelo menos 2 caracteres';
      }
      if (value.length > 100) {
        return 'Nome deve ter no máximo 100 caracteres';
      }
      return null;
    };

    // Validação de confirmação de senha
    this.validators.confirmPassword = (value, form) => {
      const password = form.querySelector('input[name="password"]')?.value;
      return value === password ? null : 'Senhas não coincidem';
    };
  }

  validators = {};

  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formType = form.dataset.authForm;
    
    // Validar todos os campos
    const isValid = this.validateForm(form);
    if (!isValid) return;

    // Mostrar loading
    this.setFormLoading(form, true);

    try {
      let response;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Processar tags para formulário de registro
      if (formType === 'register') {
        const tagsContainer = document.getElementById('user-tags');
        if (tagsContainer) {
          const tags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tag => 
            tag.textContent.replace('×', '').trim()
          );
          data.tags = tags;
        }
      }

      // Debug: log dos dados sendo enviados
      console.log('Dados do formulário:', data);

      switch (formType) {
        case 'register':
          response = await this.register(data);
          break;
        case 'login':
          response = await this.login(data);
          break;
        case 'profile':
          response = await this.updateProfile(data);
          break;
        case 'change-password':
          response = await this.changePassword(data);
          break;
        default:
          throw new Error('Tipo de formulário não reconhecido');
      }

      if (response.success) {
        this.showAlert('success', response.message);
        
        // Redirecionar se necessário
        if (formType === 'login' || formType === 'register') {
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUri = urlParams.get('redirect_uri');
            const state = urlParams.get('state');
            const scope = urlParams.get('scope');
            const codeChallenge = urlParams.get('code_challenge');
            const codeChallengeMethod = urlParams.get('code_challenge_method');
            const nonce = urlParams.get('nonce');

            if (redirectUri && state) {
              // Redirecionamento OIDC - redirecionar diretamente para o endpoint de autorização
              // O auth-service agora funciona como o oidc-server-mock
              const authUrl = new URL('/oauth/authorize', this.apiBase);
              authUrl.searchParams.set('client_id', 'workadventure-client');
              authUrl.searchParams.set('redirect_uri', redirectUri);
              authUrl.searchParams.set('response_type', 'code');
              authUrl.searchParams.set('scope', scope || 'openid profile email');
              authUrl.searchParams.set('state', state);
              authUrl.searchParams.set('playUri', redirectUri);
              
              if (codeChallenge) {
                authUrl.searchParams.set('code_challenge', codeChallenge);
                authUrl.searchParams.set('code_challenge_method', codeChallengeMethod || 'plain');
              }
              
              if (nonce) {
                authUrl.searchParams.set('nonce', nonce);
              }

              window.location.href = authUrl.toString();
            } else {
              // Redirecionar para WorkAdventure após login bem-sucedido
              window.location.href = 'http://play.workadventure.localhost/';
            }
          }, 1000);
        } else if (formType === 'profile') {
          // Atualizar dados do perfil na página
          this.updateProfileDisplay(response.data);
        }
      } else {
        this.showAlert('error', response.message);
      }
    } catch (error) {
      console.error('Erro no formulário:', error);
      this.showAlert('error', error.message || 'Erro interno do servidor');
    } finally {
      this.setFormLoading(form, false);
    }
  }

  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[data-validate]');
    
    inputs.forEach(input => {
      const fieldValid = this.validateField(input);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  }

  validateField(input) {
    const value = input.value.trim();
    const fieldName = input.name;
    const validator = this.validators[fieldName];
    
    if (!validator) return true;

    let error = null;
    
    if (fieldName === 'confirmPassword') {
      error = validator(value, input.closest('form'));
    } else {
      error = validator(value);
    }

    if (error) {
      this.showFieldError(input, error);
      return false;
    } else {
      this.clearFieldError(input);
      return true;
    }
  }

  showFieldError(input, message) {
    this.clearFieldError(input);
    
    input.classList.add('error');
    input.classList.remove('success');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
  }

  clearFieldError(input) {
    input.classList.remove('error');
    input.classList.remove('success');
    
    const errorDiv = input.parentNode.querySelector('.form-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.innerHTML = '<span class="spinner"></span> Carregando...';
      form.classList.add('loading');
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'Enviar';
      form.classList.remove('loading');
    }
  }

  showAlert(type, message) {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fade-in`;
    alert.innerHTML = `
      <span>${message}</span>
      <button type="button" onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
    `;

    const container = document.querySelector('.auth-card, .profile-container');
    if (container) {
      container.insertBefore(alert, container.firstChild);
    }

    // Auto-remover após 5 segundos
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  async register(data) {
    const response = await fetch(`${this.apiBase}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao registrar usuário');
    }

    return result;
  }

  async login(data) {
    const response = await fetch(`${this.apiBase}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao fazer login');
    }

    // Salvar token no localStorage
    if (result.data && result.data.token) {
      localStorage.setItem('auth_token', result.data.token);
      this.currentUser = result.data.user;
    }

    return result;
  }

  async updateProfile(data) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${this.apiBase}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao atualizar perfil');
    }

    return result;
  }

  async changePassword(data) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${this.apiBase}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erro ao alterar senha');
    }

    return result;
  }

  async checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${this.apiBase}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        this.currentUser = result.data;
        this.updateAuthUI();
      } else {
        localStorage.removeItem('auth_token');
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('auth_token');
      this.currentUser = null;
    }
  }

  updateAuthUI() {
    // Atualizar elementos da UI baseado no status de autenticação
    const authElements = document.querySelectorAll('[data-auth="authenticated"]');
    const guestElements = document.querySelectorAll('[data-auth="guest"]');

    if (this.currentUser) {
      authElements.forEach(el => el.style.display = 'block');
      guestElements.forEach(el => el.style.display = 'none');
      
      // Atualizar informações do usuário
      this.updateUserInfo();
    } else {
      authElements.forEach(el => el.style.display = 'none');
      guestElements.forEach(el => el.style.display = 'block');
    }
  }

  updateUserInfo() {
    if (!this.currentUser) return;

    // Atualizar nome do usuário
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
      el.textContent = this.currentUser.name;
    });

    // Atualizar email do usuário
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
      el.textContent = this.currentUser.email;
    });

    // Atualizar username
    const usernameElements = document.querySelectorAll('[data-user-username]');
    usernameElements.forEach(el => {
      el.textContent = this.currentUser.username;
    });

    // Atualizar tags
    const tagsContainer = document.getElementById('user-tags');
    if (tagsContainer) {
      this.renderTags(tagsContainer, this.currentUser.tags || []);
    }
  }

  updateProfileDisplay(userData) {
    this.currentUser = userData;
    this.updateUserInfo();
  }

  setupTagHandlers() {
    const tagInput = document.getElementById('tag-input');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagsContainer = document.getElementById('user-tags');

    if (tagInput && addTagBtn && tagsContainer) {
      addTagBtn.addEventListener('click', () => this.addTag());
      tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addTag();
        }
      });
    }
  }

  addTag() {
    const tagInput = document.getElementById('tag-input');
    const tagsContainer = document.getElementById('user-tags');
    
    if (!tagInput || !tagsContainer) return;

    const tagValue = tagInput.value.trim();
    if (!tagValue) return;

    // Verificar se a tag já existe
    const existingTags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tag => 
      tag.textContent.replace('×', '').trim()
    );

    if (existingTags.includes(tagValue)) {
      this.showAlert('warning', 'Tag já existe');
      return;
    }

    // Adicionar tag visualmente
    this.renderTag(tagsContainer, tagValue);
    tagInput.value = '';

    // Atualizar perfil
    this.updateProfileTags();
  }

  removeTag(tagElement) {
    tagElement.remove();
    this.updateProfileTags();
  }

  renderTag(container, tagValue) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      ${tagValue}
      <button type="button" class="tag-remove" onclick="authApp.removeTag(this.parentElement)">&times;</button>
    `;
    container.appendChild(tag);
  }

  renderTags(container, tags) {
    container.innerHTML = '';
    tags.forEach(tag => this.renderTag(container, tag));
  }

  updateProfileTags() {
    const tagsContainer = document.getElementById('user-tags');
    if (!tagsContainer) return;

    const tags = Array.from(tagsContainer.querySelectorAll('.tag')).map(tag => 
      tag.textContent.replace('×', '').trim()
    );

    // Atualizar via API
    this.updateProfile({ tags });
  }

  async initiateOIDCFlow(redirectUri, state, scope, codeChallenge, codeChallengeMethod, nonce) {
    try {
      // Salvar parâmetros OIDC para uso posterior
      localStorage.setItem('oidc_redirect_uri', redirectUri);
      localStorage.setItem('oidc_state', state);
      
      // Construir URL de autorização OIDC
      const authUrl = new URL('/oauth/authorize', this.apiBase);
      authUrl.searchParams.set('client_id', 'workadventure-client');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope || 'openid profile email');
      authUrl.searchParams.set('state', state);
      
      if (codeChallenge) {
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', codeChallengeMethod || 'plain');
      }
      
      if (nonce) {
        authUrl.searchParams.set('nonce', nonce);
      }

      // Redirecionar para o endpoint de autorização OIDC
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Erro ao iniciar fluxo OIDC:', error);
      this.showAlert('error', 'Erro ao processar autenticação. Tente novamente.');
    }
  }

  async handleLogout(event) {
    event.preventDefault();
    
    if (confirm('Tem certeza que deseja sair?')) {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await fetch(`${this.apiBase}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      } finally {
        localStorage.removeItem('auth_token');
        this.currentUser = null;
        window.location.href = '/login.html';
      }
    }
  }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  window.authApp = new AuthApp();
});

// Utilitários globais
window.showAlert = (type, message) => {
  if (window.authApp) {
    window.authApp.showAlert(type, message);
  }
};

window.validateField = (input) => {
  if (window.authApp) {
    return window.authApp.validateField(input);
  }
};
