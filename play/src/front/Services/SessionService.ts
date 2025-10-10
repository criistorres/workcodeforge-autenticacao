/**
 * SessionService
 *
 * Serviço responsável por verificar o estado de autenticação do usuário
 * fazendo requests para o serviço de autenticação.
 */

export interface SessionCheckResponse {
    authenticated: boolean;
    user?: {
        id: string;
        email: string;
        name: string;
        username: string;
        tags: string[];
        defaultMap?: string;
    };
}

export class SessionService {
    private static AUTH_SERVICE_URL = "http://auth.workadventure.localhost";

    /**
     * Verifica se o usuário possui uma sessão ativa
     * Faz request para /auth/check-session com credentials (cookies)
     */
    public static async checkSession(): Promise<SessionCheckResponse> {
        try {
            console.log("[SessionService] Verificando sessão de autenticação...");

            const response = await fetch(`${this.AUTH_SERVICE_URL}/auth/check-session`, {
                method: "GET",
                credentials: "include", // Importante: envia cookies cross-domain
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.warn(`[SessionService] Resposta não OK do servidor: ${response.status} ${response.statusText}`);
                return { authenticated: false };
            }

            const data: SessionCheckResponse = await response.json();
            console.log(
                `[SessionService] Sessão verificada: ${data.authenticated ? "Autenticado" : "Não autenticado"}`
            );

            if (data.authenticated && data.user) {
                console.log(`[SessionService] Usuário: ${data.user.name} (${data.user.email})`);
            }

            return data;
        } catch (error) {
            console.error("[SessionService] Erro ao verificar sessão:", error);
            return { authenticated: false };
        }
    }

    /**
     * Verifica se o usuário está autenticado (retorna apenas boolean)
     */
    public static async isAuthenticated(): Promise<boolean> {
        const session = await this.checkSession();
        return session.authenticated;
    }
}
