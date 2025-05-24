import type { PeugeotApiData, PeugeotLoginResponse } from '../types/plan';

interface PeugeotAuthConfig {
    documentNumber: string;
    password: string;
    documentType: string;
    brand: string;
}

export class PeugeotService {
    private token: string | null = null;
    private tokenExpiration: number | null = null;
    private readonly TOKEN_DURATION = 12 * 60 * 60 * 1000; // 12 horas en milisegundos

    constructor() {
        // Intentar recuperar el token del localStorage si existe
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('peugeot_token');
            const expiration = localStorage.getItem('peugeot_token_expiration');
            this.tokenExpiration = expiration ? parseInt(expiration) : null;
        }
    }

    private isTokenExpired(): boolean {
        if (!this.tokenExpiration) return true;
        return Date.now() >= this.tokenExpiration;
    }

    private async login(config: PeugeotAuthConfig): Promise<string> {
        const response = await fetch('/api/peugeot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error(`Error en la autenticación: ${response.statusText}`);
        }

        const data: PeugeotLoginResponse = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Error en la autenticación: ${data.statusReason}`);
        }

        this.token = data.token;
        this.tokenExpiration = Date.now() + this.TOKEN_DURATION;

        // Guardar el token en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('peugeot_token', data.token);
            localStorage.setItem('peugeot_token_expiration', this.tokenExpiration.toString());
        }

        return data.token;
    }

    private async ensureAuthenticated(config: PeugeotAuthConfig): Promise<void> {
        if (!this.token || this.isTokenExpired()) {
            await this.login(config);
        }
    }

    async fetchPlanData(config: PeugeotAuthConfig): Promise<PeugeotApiData> {
        await this.ensureAuthenticated(config);

        const response = await fetch(`/api/peugeot?token=${this.token}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener datos del plan: ${response.statusText}`);
        }

        return response.json();
    }
}

// Exportar una instancia singleton del servicio
export const peugeotService = new PeugeotService();
