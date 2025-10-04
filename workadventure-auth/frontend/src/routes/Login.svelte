<script>
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let isRegister = false;
  let name = '';

  let clientId = '';
  let redirectUri = '';
  let state = '';
  let nonce = '';
  let scope = '';

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    clientId = params.get('client_id') || '';
    redirectUri = params.get('redirect_uri') || '';
    state = params.get('state') || '';
    nonce = params.get('nonce') || undefined;
    scope = params.get('scope') || '';
  });

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { email, password, name }
        : { email, password };

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro na autenticação');
      }

      const { userId } = await response.json();

      const authResponse = await fetch('/auth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clientId,
          redirectUri,
          scope,
          state,
          nonce
        })
      });

      const { code } = await authResponse.json();

      window.location.href = `${redirectUri}?code=${code}&state=${state}`;

    } catch (err) {
      error = err.message;
      loading = false;
    }
  }
</script>

<div class="container">
  <div class="login-box">
    <h1>{isRegister ? 'Registrar' : 'Entrar'} no WorkAdventure</h1>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      {#if isRegister}
        <div class="form-group">
          <label for="name">Nome:</label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="Seu nome completo"
            required
            disabled={loading}
          />
        </div>
      {/if}

      <div class="form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="[email protected]"
          required
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">Senha:</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? '⏳ Processando...' : isRegister ? '📝 Registrar' : '🔐 Entrar'}
      </button>
    </form>

    <div class="toggle">
      <button
        type="button"
        class="link"
        on:click={() => isRegister = !isRegister}
        disabled={loading}
      >
        {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Registrar'}
      </button>
    </div>

    <div class="info">
      <h3>👤 Usuários de teste:</h3>
      <ul>
        <li><strong>Email:</strong> admin{'@'}example.com | <strong>Senha:</strong> pwd | <strong>Tags:</strong> admin, moderator</li>
        <li><strong>Email:</strong> user1{'@'}example.com | <strong>Senha:</strong> pwd | <strong>Tags:</strong> admin, moderator</li>
        <li><strong>Email:</strong> user2{'@'}example.com | <strong>Senha:</strong> pwd | <strong>Tags:</strong> member</li>
      </ul>
      <p style="margin-top: 1rem; color: #666; font-size: 0.8rem;">
        💡 Dica: Use <code>admin@example.com</code> para login como admin
      </p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 2rem;
  }

  .login-box {
    background: white;
    border-radius: 16px;
    padding: 3rem;
    max-width: 450px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  h1 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.8rem;
    text-align: center;
  }

  .error {
    padding: 1rem;
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    color: #c33;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  button[type="submit"] {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  button[type="submit"]:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }

  button[type="submit"]:active:not(:disabled) {
    transform: translateY(0);
  }

  button[type="submit"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toggle {
    margin-top: 1.5rem;
    text-align: center;
  }

  .link {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: 0.9rem;
    text-decoration: underline;
    padding: 0;
  }

  .link:hover:not(:disabled) {
    color: #764ba2;
  }

  .info {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .info h3 {
    margin: 0 0 0.5rem 0;
    color: #555;
    font-size: 0.9rem;
  }

  .info ul {
    margin: 0;
    padding-left: 1.2rem;
    list-style: none;
  }

  .info li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
    color: #666;
  }
</style>
