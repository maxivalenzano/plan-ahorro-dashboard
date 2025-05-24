import type { NissanAccessResponse, NissanLoginResponse, NissanStatementItem } from '../types/plan';

interface NissanAuthConfig {
    group: string;
    quota: string;
    version: string;
    password: string;
}

export class NissanService {
    private token: string | null = null;
    private uidQuota: string | null = null;
    private tid: string | null = null;
    private accessCode: string | null = null;
    private tokenExpiration: number | null = null;
    private readonly TOKEN_DURATION = 12 * 60 * 60 * 1000; // 12 horas en milisegundos

    constructor() {
        // Intentar recuperar las credenciales del localStorage si existen
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('nissan_token');
            this.uidQuota = localStorage.getItem('nissan_uid_quota');
            this.tid = localStorage.getItem('nissan_tid');
            this.accessCode = localStorage.getItem('nissan_access_code');
            const expiration = localStorage.getItem('nissan_token_expiration');
            this.tokenExpiration = expiration ? parseInt(expiration) : null;
        }
    }

    private isTokenExpired(): boolean {
        if (!this.tokenExpiration) return true;
        return Date.now() >= this.tokenExpiration;
    }

    private async getAccess(): Promise<{ tid: string; accessCode: string }> {
        const response = await fetch('/api/nissan?type=access', {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener acceso: ${response.statusText}`);
        }

        const data: NissanAccessResponse = await response.json();

        this.tid = data.tid;
        this.accessCode = data.accessCode;

        // Guardar en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('nissan_tid', data.tid);
            localStorage.setItem('nissan_access_code', data.accessCode);
        }

        return data;
    }

    private async login(config: NissanAuthConfig): Promise<{ token: string; uidQuota: string }> {
        // Asegurarse de tener tid y accessCode
        if (!this.tid || !this.accessCode) {
            await this.getAccess();
        }

        const response = await fetch('/api/nissan', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...config,
                tid: this.tid,
                accessCode: this.accessCode,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error en la autenticación: ${response.statusText}`);
        }

        const data: NissanLoginResponse = await response.json();

        this.token = data.token;
        this.uidQuota = data.uidQuota;
        this.tokenExpiration = Date.now() + this.TOKEN_DURATION;

        // Guardar en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('nissan_token', data.token);
            localStorage.setItem('nissan_uid_quota', data.uidQuota);
            localStorage.setItem('nissan_token_expiration', this.tokenExpiration.toString());
        }

        return {
            token: data.token,
            uidQuota: data.uidQuota,
        };
    }

    private async ensureAuthenticated(config: NissanAuthConfig): Promise<void> {
        if (!this.token || !this.uidQuota || this.isTokenExpired()) {
            await this.login(config);
        }
    }

    async fetchStatement(config: NissanAuthConfig): Promise<NissanStatementItem[]> {
        await this.ensureAuthenticated(config);

        const response = await fetch(`/api/nissan?type=statement&token=${this.token}&uidQuota=${this.uidQuota}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener el estado de cuenta: ${response.statusText}`);
        }

        return response.json();
    }
}

// Exportar una instancia singleton del servicio
export const nissanService = new NissanService();
