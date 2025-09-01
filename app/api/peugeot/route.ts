import { NextResponse } from 'next/server';

const PEUGEOT_API_BASE_URL = 'https://www.peugeotplan.com.ar';

// Cache simple para cookies (válido por 5 minutos)
let cookieCache: { cookies: string; timestamp: number } | null = null;
const COOKIE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para obtener cookies frescas de la página principal
async function getFreshCookies(): Promise<string> {
    try {
        // Verificar si tenemos cookies en cache y son válidas
        const now = Date.now();
        if (cookieCache && now - cookieCache.timestamp < COOKIE_CACHE_DURATION) {
            console.log('🚀 ~ getFreshCookies ~ Usando cookies del cache');
            return cookieCache.cookies;
        }
        // Hacer request a la página principal para obtener cookies
        const response = await fetch(PEUGEOT_API_BASE_URL, {
            method: 'GET',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            },
        });

        // Extraer cookies del header Set-Cookie
        const setCookieHeader = response.headers.get('set-cookie');
        console.log('🚀 ~ getFreshCookies ~ Set-Cookie header:', setCookieHeader);

        if (!setCookieHeader) {
            console.log('🚀 ~ getFreshCookies ~ No se recibieron cookies, usando fallback');
            return 'Cookie_bot=05c22100f4d87f313a5b093e9ffec0f6'; // Fallback básico
        }

        // Parsear las cookies de manera más robusta
        // El header Set-Cookie puede contener múltiples cookies separadas por comas
        const cookieStrings: string[] = [];
        const setCookieEntries = setCookieHeader.split(/,(?=\s*[^=;,]+=[^;,]+)/);

        for (const entry of setCookieEntries) {
            const [nameValuePart] = entry.trim().split(';');
            if (nameValuePart && nameValuePart.includes('=')) {
                cookieStrings.push(nameValuePart.trim());
            }
        }

        const cookies = cookieStrings.join('; ');

        // Si no hay cookies válidas, usar fallback
        if (!cookies || cookies.length === 0) {
            console.log('🚀 ~ getFreshCookies ~ No cookies válidas encontradas, usando fallback');
            const fallbackCookies = 'Cookie_bot=05c22100f4d87f313a5b093e9ffec0f6';

            // Guardar en cache incluso el fallback
            cookieCache = {
                cookies: fallbackCookies,
                timestamp: Date.now(),
            };

            return fallbackCookies;
        }

        // Guardar cookies válidas en cache
        cookieCache = {
            cookies: cookies,
            timestamp: Date.now(),
        };

        return cookies;
    } catch (error) {
        console.error('🚀 ~ getFreshCookies ~ Error:', error);

        // Si hay cookies en cache, usarlas aunque hayan expirado
        if (cookieCache) {
            console.log('🚀 ~ getFreshCookies ~ Error pero usando cache expirado');
            return cookieCache.cookies;
        }

        // Último recurso: fallback básico
        const fallbackCookies = 'Cookie_bot=05c22100f4d87f313a5b093e9ffec0f6';

        // Guardar en cache el fallback
        cookieCache = {
            cookies: fallbackCookies,
            timestamp: Date.now(),
        };

        return fallbackCookies;
    }
}

export async function POST(request: Request) {
    try {
        const { documentNumber, password, documentType, brand } = await request.json();

        // Obtener cookies frescas antes de hacer la autenticación
        const freshCookies = await getFreshCookies();

        const url = `${PEUGEOT_API_BASE_URL}/security/validateUser/${documentNumber}/${password}/${documentType}/${brand}`;

        // Headers con cookies dinámicas
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'sec-ch-ua-platform': '"Windows"',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                Accept: 'application/json, text/plain, */*',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'Content-Type': 'application/json;charset=utf-8',
                'sec-ch-ua-mobile': '?0',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                host: 'www.peugeotplan.com.ar',
                Cookie: freshCookies,
            },
        });
        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Según el interceptor de Postman, la respuesta es texto, no JSON
        const responseText = await response.text();

        // Intentar parsear como JSON primero, si no funciona, manejar como XML/texto
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // Si contiene información de error, lanzar error
            if (responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('invalid')) {
                throw new Error(`API devolvió error: ${responseText.substring(0, 200)}...`);
            }

            // Si es XML válido o texto, intentar extraer información útil
            data = {
                responseText: responseText,
                contentType: contentType,
                message: 'Respuesta no es JSON válido',
                success: responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('valid'),
            };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en la autenticación:', error);
        return NextResponse.json({ error: 'Error en la autenticación' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
        }

        const url = `${PEUGEOT_API_BASE_URL}/services/tuscuotas/content/3303/150`;

        // Obtener cookies frescas para la solicitud de datos
        const freshCookies = await getFreshCookies();

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: token,
                'sec-ch-ua-platform': '"Windows"',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                Accept: 'application/json, text/plain, */*',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                host: 'www.peugeotplan.com.ar',
                Cookie: freshCookies,
            },
        });

        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Obtener respuesta como texto primero
        const responseText = await response.text();

        // Intentar parsear como JSON primero, si no funciona, manejar como XML/texto
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            // Si contiene información de error, lanzar error
            if (responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('invalid')) {
                throw new Error(`API devolvió error: ${responseText.substring(0, 200)}...`);
            }

            // Si es XML válido o texto, intentar extraer información útil
            data = {
                responseText: responseText,
                contentType: contentType,
                message: 'Respuesta no es JSON válido',
                success: responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('valid'),
            };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error al obtener datos del plan:', error);
        return NextResponse.json({ error: 'Error al obtener datos del plan' }, { status: 500 });
    }
}
