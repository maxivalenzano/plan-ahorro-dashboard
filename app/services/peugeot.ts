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
            credentials: 'include', // Incluir cookies automáticamente
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            throw new Error(`Error en la autenticación: ${response.statusText}`);
        }

        const data = await response.json();

        // Verificar si la respuesta contiene texto/XML (indica problema con la API)
        if (data.responseText || data.xmlResponse) {
            // Analizar el contenido de texto para determinar si es exitoso
            const responseContent = data.responseText || data.xmlResponse || '';

            // Si contiene información que parece un token o éxito, intentar extraerlo
            if (responseContent.includes('<') && responseContent.includes('>')) {
                // Es XML, intentar extraer información útil
                console.log('🚀 ~ login ~ Parsing XML response...');

                // Por ahora, lanzar error informativo hasta que sepamos el formato exacto
                throw new Error(`La API de Peugeot devolvió XML. Contenido: ${responseContent.substring(0, 500)}...`);
            } else {
                // Es texto plano
                throw new Error(
                    `La API de Peugeot devolvió texto en lugar de JSON. Contenido: ${responseContent.substring(
                        0,
                        200
                    )}...`
                );
            }
        }

        // Verificar el formato esperado de respuesta JSON
        if (!data.status) {
            console.log('🚀 ~ login ~ Unexpected response format:', data);
            throw new Error(`Respuesta inesperada de la API de Peugeot: ${JSON.stringify(data)}`);
        }

        if (data.status !== 'OK') {
            throw new Error(`Error en la autenticación: ${data.statusReason || 'Status no OK'}`);
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
        await this.login(config);
    }

    async fetchPlanData(config: PeugeotAuthConfig): Promise<PeugeotApiData> {
        await this.ensureAuthenticated(config);

        const response = await fetch(`/api/peugeot?token=${this.token}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            credentials: 'include', // Incluir cookies automáticamente
        });

        if (!response.ok) {
            throw new Error(`Error al obtener datos del plan: ${response.statusText}`);
        }

        const data = await response.json();

        // Verificar si la respuesta contiene texto/XML (indica problema con la API)
        if (data.responseText || data.xmlResponse) {
            const responseContent = data.responseText || data.xmlResponse || '';

            if (responseContent.includes('<') && responseContent.includes('>')) {
                // Es XML, intentar extraer información útil
                console.log('🚀 ~ fetchPlanData ~ Parsing XML response...');
                throw new Error(
                    `La API de Peugeot devolvió XML para datos del plan. Contenido: ${responseContent.substring(
                        0,
                        500
                    )}...`
                );
            } else {
                // Es texto plano
                throw new Error(
                    `La API de Peugeot devolvió texto para datos del plan. Contenido: ${responseContent.substring(
                        0,
                        200
                    )}...`
                );
            }
        }

        return data;
    }
}

// Exportar una instancia singleton del servicio
export const peugeotService = new PeugeotService();
