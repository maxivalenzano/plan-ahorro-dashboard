import type { PeugeotApiData, NissanApiData, DollarRate } from '../types/plan';
import { peugeotService } from './peugeot';
import { nissanService } from './nissan';
import { dollarService } from './dollar';

// Mock data that follows the API structures described
export async function fetchPeugeotData(): Promise<PeugeotApiData> {
    // Simulate API delay
    const config = {
        documentNumber: '38574268',
        password: 'Maxi1996',
        documentType: 'DNI',
        brand: 'P',
    };

    try {
        const planData = await peugeotService.fetchPlanData(config);
        return planData;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        throw error;
    }
}

export async function fetchNissanData(): Promise<NissanApiData> {
    const config = {
        group: '000102',
        quota: '0154',
        version: '00',
        password: 'YwsqK0tgnexnI1kDpoCVcg==',
    };

    try {
        const statement = await nissanService.fetchStatement(config);

        // Filtrar movimientos de cuotas mensuales y seguros
        const relevantMovements = statement.filter(
            (item) =>
                item.motionDescription === 'COBRO DE CUOTA MENSUAL' || item.motionDescription === 'SEGURO VEHICULO'
        );

        // Agrupar movimientos por mes y sumar los montos
        const movementsByMonth = relevantMovements.reduce((acc, item) => {
            const monthKey = item.paidDate.substring(0, 7); // Formato: YYYY-MM
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    installmentNumber: item.installmentNumber,
                    paidDate: item.paidDate,
                    motionDescription: 'CUOTA MENSUAL + SEGURO',
                    totalValue: 0,
                };
            }
            acc[monthKey].installmentNumber = acc[monthKey].installmentNumber || item.installmentNumber;
            acc[monthKey].totalValue += item.totalValue;
            return acc;
        }, {} as Record<string, any>);

        // Convertir el objeto agrupado a array y ordenar por fecha
        const movements = Object.values(movementsByMonth).sort(
            (a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
        );

        // Calcular el total pagado
        const paidValues = movements.reduce((sum, item) => sum + item.totalValue, 0);

        return {
            movements,
            summary: {
                goodName: 'NEW VERSA 1.6 SENSE MT', // TODO: Obtener de la API cuando esté disponible
                salesPlanName: 'PLAN 80/20 120 MESES', // TODO: Obtener de la API cuando esté disponible
                paidValues,
            },
        };
    } catch (error) {
        console.error('Error al obtener datos de Nissan:', error);
        throw error;
    }
}

export async function fetchDollarRates(): Promise<DollarRate[]> {
    return dollarService.getRates();
}
