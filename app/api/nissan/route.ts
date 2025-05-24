import { NextResponse } from 'next/server';

const NISSAN_API_BASE_URL = 'https://clientes.nissanplandeahorro.com.ar/apis/v1';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'access') {
            const response = await fetch(`${NISSAN_API_BASE_URL}/access`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'x-nwu': 'c8ee603e-6af0-4eee-a7f0-2fb3d6981d7e',
                    'X-TKNA': 'zqi4HpK/DlLOKOiNDwbljrtHgu+GRipyLv6DWjYrqqTMCR6ItuuSzbhvMyQJ2eul',
                },
            });

            const data = await response.json();
            return NextResponse.json(data);
        }

        if (type === 'statement') {
            const token = searchParams.get('token');
            const uidQuota = searchParams.get('uidQuota');

            if (!token || !uidQuota) {
                return NextResponse.json({ error: 'Token o uidQuota no proporcionados' }, { status: 400 });
            }

            const response = await fetch(`${NISSAN_API_BASE_URL}/quotas/statement/paidstatement?quotauid=${uidQuota}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json, text/plain, */*',
                    'x-nwu': 'c8ee603e-6af0-4eee-a7f0-2fb3d6981d7e',
                    'X-TKNA': 'zqi4HpK/DlLOKOiNDwbljrtHgu+GRipyLv6DWjYrqqTMCR6ItuuSzbhvMyQJ2eul',
                },
            });

            const data = await response.json();
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Tipo de solicitud no válido' }, { status: 400 });
    } catch (error) {
        console.error('Error en la solicitud:', error);
        return NextResponse.json({ error: 'Error en la solicitud' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { group, quota, version, password, tid, accessCode } = body;

        const response = await fetch(`${NISSAN_API_BASE_URL}/login/groupquotaversion`, {
            method: 'POST',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'x-nwu': 'c8ee603e-6af0-4eee-a7f0-2fb3d6981d7e',
                'X-TKNA': 'zqi4HpK/DlLOKOiNDwbljrtHgu+GRipyLv6DWjYrqqTMCR6ItuuSzbhvMyQJ2eul',
            },
            body: JSON.stringify({
                group,
                quota,
                version,
                password,
                tid,
                accessCode,
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en la autenticación:', error);
        return NextResponse.json({ error: 'Error en la autenticación' }, { status: 500 });
    }
}
