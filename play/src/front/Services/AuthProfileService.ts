// Deriva a URL do auth a partir do domínio atual (play.X -> auth.X)
const AUTH_API_URL = (() => {
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    // Se estiver em localhost ou dev, usa http://auth.workadventure.localhost
    if (currentHost.includes('workadventure.localhost') || currentHost === 'localhost') {
        return "http://auth.workadventure.localhost";
    }
    // Em produção, substitui 'play.' por 'auth.'
    const authHost = currentHost.replace(/^play\./, 'auth.');
    return `${protocol}//${authHost}`;
})();

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    username: string;
    telefone?: string;
    cpf?: string;
    departamento?: string;
    avatarUrl?: string;
    tags: string[];
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: Date;
    lastLogin?: Date;
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    username?: string;
    telefone?: string;
    cpf?: string;
    departamento?: string;
}

class AuthProfileService {
    private parseJwt(token: string): Record<string, unknown> | null {
        try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Erro ao decodificar JWT:", e);
            return null;
        }
    }

    private getUserId(): string | null {
        // Primeiro tentar pegar do localStorage direto (caso esteja salvo)
        const directUserId = localStorage.getItem("userId");
        if (directUserId) {
            console.log("[AuthProfileService] userId encontrado no localStorage:", directUserId);
            return directUserId;
        }

        // Se não, tentar pegar do JWT token do WorkAdventure
        const authToken = localStorage.getItem("authToken");
        console.log("[AuthProfileService] authToken:", authToken ? "encontrado" : "não encontrado");

        if (authToken) {
            const payload = this.parseJwt(authToken);
            console.log("[AuthProfileService] JWT payload:", payload);

            // O WorkAdventure armazena um objeto com accessToken dentro
            // Precisamos decodificar o accessToken para pegar o sub
            if (payload && typeof payload.accessToken === "string") {
                const accessTokenPayload = this.parseJwt(payload.accessToken);
                console.log("[AuthProfileService] AccessToken payload:", accessTokenPayload);

                if (accessTokenPayload && typeof accessTokenPayload.sub === "string") {
                    console.log("[AuthProfileService] userId do accessToken:", accessTokenPayload.sub);
                    return accessTokenPayload.sub;
                }
            }

            // Fallback: verificar se sub está direto no payload
            if (payload && typeof payload.sub === "string") {
                console.log("[AuthProfileService] userId do JWT:", payload.sub);
                return payload.sub;
            }
        }

        console.log("[AuthProfileService] Nenhum userId encontrado");
        return null;
    }

    private getHeaders(): HeadersInit {
        const userId = this.getUserId();
        return {
            "Content-Type": "application/json",
            "X-User-Id": userId || "",
        };
    }

    async getMyProfile(): Promise<UserProfile> {
        const userId = this.getUserId();
        if (!userId) {
            throw new Error("Usuário não autenticado");
        }

        const response = await fetch(`${AUTH_API_URL}/users/me`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Erro ao carregar perfil" }));
            throw new Error(error.message || "Erro ao carregar perfil");
        }

        return response.json();
    }

    async updateMyProfile(data: UpdateProfileData): Promise<UserProfile> {
        const userId = this.getUserId();
        if (!userId) {
            throw new Error("Usuário não autenticado");
        }

        const response = await fetch(`${AUTH_API_URL}/users/me`, {
            method: "PATCH",
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Erro ao atualizar perfil" }));
            throw new Error(error.message || "Erro ao atualizar perfil");
        }

        return response.json();
    }
}

export const authProfileService = new AuthProfileService();
