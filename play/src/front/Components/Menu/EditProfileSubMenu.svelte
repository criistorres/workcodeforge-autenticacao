<script lang="ts">
    import { onMount } from "svelte";
    import { LL } from "../../../i18n/i18n-svelte";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { authProfileService } from "../../Services/AuthProfileService";

    let loading = true;
    let saving = false;
    let name = "";
    let email = "";
    let username = "";
    let telefone = "";
    let cpf = "";
    let departamento = "";
    let saveSuccess = false;
    let saveError = "";

    // Carregar dados do perfil
    onMount(async () => {
        try {
            const profile = await authProfileService.getMyProfile();
            name = profile.name || "";
            email = profile.email || "";
            username = profile.username || "";
            telefone = profile.telefone || "";
            cpf = profile.cpf || "";
            departamento = profile.departamento || "";
        } catch (err) {
            console.error("Erro ao carregar perfil:", err);
            saveError = err instanceof Error ? err.message : "Erro ao carregar perfil";
            // Fallback para dados locais
            name = gameManager.getPlayerName() || "";
        } finally {
            loading = false;
        }
    });

    // Máscara para telefone
    function maskTelefone(value: string): string {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        }
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }

    // Máscara para CPF
    function maskCPF(value: string): string {
        const cleaned = value.replace(/\D/g, "");
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
    }

    // Validar CPF
    function isValidCPF(cpf: string): boolean {
        const cleaned = cpf.replace(/\D/g, "");
        if (cleaned.length !== 11) return false;

        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cleaned)) return false;

        // Validar dígitos verificadores
        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

        return true;
    }

    // Handlers para máscaras
    function handleTelefoneInput(event: Event) {
        const input = event.target as HTMLInputElement;
        telefone = maskTelefone(input.value);
    }

    function handleCPFInput(event: Event) {
        const input = event.target as HTMLInputElement;
        cpf = maskCPF(input.value);
    }

    async function handleSave() {
        saveError = "";
        saveSuccess = false;
        saving = true;

        // Validação básica
        if (!name.trim()) {
            saveError = "Nome é obrigatório";
            saving = false;
            return;
        }

        // Validar CPF se preenchido
        if (cpf && !isValidCPF(cpf)) {
            saveError = "CPF inválido";
            saving = false;
            return;
        }

        try {
            // Atualizar no backend
            await authProfileService.updateMyProfile({
                name,
                email,
                username,
                telefone: telefone || undefined,
                cpf: cpf || undefined,
                departamento: departamento || undefined,
            });

            // Atualizar gameManager se o nome mudou
            if (name !== gameManager.getPlayerName()) {
                gameManager.setPlayerName(name);
                localStorage.setItem("playerName", name);
            }

            saveSuccess = true;
            setTimeout(() => {
                saveSuccess = false;
            }, 3000);
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
            saveError = err instanceof Error ? err.message : "Erro ao salvar perfil";
        } finally {
            saving = false;
        }
    }

    function handleCancel() {
        // Recarregar dados
        location.reload();
    }
</script>

<div class="customize-main">
    <div class="content">
        <section class="p-6 @md/main-layout:p-8 space-y-6">
            <!-- Header -->
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-white mb-2">
                    {$LL.menu.sub.editProfile()}
                </h1>
                <p class="text-sm text-white/60">Edite suas informações de perfil</p>
            </div>

            {#if loading}
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div
                            class="animate-spin h-12 w-12 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p class="text-white/60">Carregando...</p>
                    </div>
                </div>
            {:else}
                <!-- Messages -->
                {#if saveSuccess}
                    <div class="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
                        ✅ Perfil atualizado com sucesso!
                    </div>
                {/if}

                {#if saveError}
                    <div class="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        ❌ {saveError}
                    </div>
                {/if}

                <!-- Form -->
                <form on:submit|preventDefault={handleSave} class="space-y-6">
                    <!-- Nome -->
                    <div class="space-y-2">
                        <label for="name" class="block text-sm font-semibold text-white uppercase tracking-wider">
                            Nome *
                        </label>
                        <input
                            id="name"
                            type="text"
                            bind:value={name}
                            placeholder="Seu nome completo"
                            required
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- Email -->
                    <div class="space-y-2">
                        <label for="email" class="block text-sm font-semibold text-white uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="[email protected]"
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- Username -->
                    <div class="space-y-2">
                        <label for="username" class="block text-sm font-semibold text-white uppercase tracking-wider">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            bind:value={username}
                            placeholder="@seu_username"
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- Telefone -->
                    <div class="space-y-2">
                        <label for="telefone" class="block text-sm font-semibold text-white uppercase tracking-wider">
                            Telefone
                        </label>
                        <input
                            id="telefone"
                            type="text"
                            value={telefone}
                            on:input={handleTelefoneInput}
                            placeholder="(XX) XXXXX-XXXX"
                            maxlength="15"
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- CPF -->
                    <div class="space-y-2">
                        <label for="cpf" class="block text-sm font-semibold text-white uppercase tracking-wider">
                            CPF
                        </label>
                        <input
                            id="cpf"
                            type="text"
                            value={cpf}
                            on:input={handleCPFInput}
                            placeholder="XXX.XXX.XXX-XX"
                            maxlength="14"
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- Departamento -->
                    <div class="space-y-2">
                        <label
                            for="departamento"
                            class="block text-sm font-semibold text-white uppercase tracking-wider"
                        >
                            Departamento
                        </label>
                        <input
                            id="departamento"
                            type="text"
                            bind:value={departamento}
                            placeholder="Ex: TI, RH, Financeiro..."
                            disabled={saving}
                            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 disabled:opacity-50"
                        />
                    </div>

                    <!-- Botões -->
                    <div class="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-white font-bold rounded-lg hover:from-secondary/90 hover:to-secondary/70 focus:outline-none focus:ring-2 focus:ring-secondary/50 transform hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-lg hover:shadow-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {#if saving}
                                <span class="flex items-center justify-center gap-2">
                                    <div
                                        class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    Salvando...
                                </span>
                            {:else}
                                💾 Salvar
                            {/if}
                        </button>
                        <button
                            type="button"
                            on:click={handleCancel}
                            disabled={saving}
                            class="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ❌ Cancelar
                        </button>
                    </div>
                </form>

                <!-- Info -->
                <div class="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p class="text-xs text-white/60 flex items-start gap-2">
                        <span class="text-base">💡</span>
                        <span>
                            Seus dados serão salvos de forma segura no servidor de autenticação. Campos com * são
                            obrigatórios.
                        </span>
                    </p>
                </div>
            {/if}
        </section>
    </div>
</div>
